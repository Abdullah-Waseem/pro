/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "./custom-button.less";
import {
  createSignal,
  createEffect,
  onMount,
  Show,
  onCleanup,
  startTransition,
  Component,
} from "solid-js";

import {
  init,
  dispose,
  utils,
  Nullable,
  Chart,
  OverlayMode,
  Styles,
  TooltipIconPosition,
  ActionType,
  PaneOptions,
  Indicator,
  DomPosition,
  FormatDateType,
  registerOverlay,
  registerFigure,
} from "klinecharts";

import lodashSet from "lodash/set";
import lodashClone from "lodash/cloneDeep";

import { SelectDataSourceItem, Loading, Button } from "./component";

import {
  PeriodBar,
  DrawingBar,
  IndicatorModal,
  TimezoneModal,
  SettingModal,
  ScreenshotModal,
  IndicatorSettingModal,
  SymbolSearchModal,
} from "./widget";

import { translateTimezone } from "./widget/timezone-modal/data";

import {
  SymbolInfo,
  Period,
  ChartProOptions,
  ChartPro,
  TradesData,
} from "./types";
import {
  formatTimerText,
  getCandleStickInterval,
} from "./utils/timerCalculations";

export interface ChartProComponentProps
  extends Required<Omit<ChartProOptions, "container">> {
  ref: (chart: ChartPro) => void;
}

interface PrevSymbolPeriod {
  symbol: SymbolInfo;
  period: Period;
}

function createIndicator(
  widget: Nullable<Chart>,
  indicatorName: string,
  isStack?: boolean,
  paneOptions?: PaneOptions,
  calcParams?: number[]
): Nullable<string> {
  paneOptions = { height: 180, ...paneOptions };
  if (indicatorName === "VOL") {
    paneOptions = { gap: { bottom: 2 }, ...paneOptions };
  }
  return (
    widget?.createIndicator(
      {
        name: indicatorName,
        calcParams: calcParams,
        // @ts-expect-error
        createTooltipDataSource: ({ indicator, defaultStyles }) => {
          const icons = [];
          if (indicator.visible) {
            icons.push(defaultStyles.tooltip.icons[1]);
            icons.push(defaultStyles.tooltip.icons[2]);
            icons.push(defaultStyles.tooltip.icons[3]);
          } else {
            icons.push(defaultStyles.tooltip.icons[0]);
            icons.push(defaultStyles.tooltip.icons[2]);
            icons.push(defaultStyles.tooltip.icons[3]);
          }
          return { icons };
        },
      },
      isStack,
      paneOptions
    ) ?? null
  );
}

const ChartProComponent: Component<ChartProComponentProps> = (props) => {
  let widgetRef: HTMLDivElement | undefined = undefined;
  let widget: Nullable<Chart> = null;

  let priceUnitDom: HTMLElement;

  let loading = false;

  const [theme, setTheme] = createSignal(props.theme);
  const [styles, setStyles] = createSignal(props.styles);
  const [locale, setLocale] = createSignal(props.locale);

  const [symbol, setSymbol] = createSignal(props.symbol);
  const [period, setPeriod] = createSignal(props.period);

  // const [lastDataPoint, setLastDataPoint] = createSignal({
  //   timestamp: 0,
  //   close: 0,
  // });

  const [indicatorModalVisible, setIndicatorModalVisible] = createSignal(false);
  const [mainIndicators, setMainIndicators] = createSignal([
    ...props.mainIndicators!,
  ]);
  const [subIndicators, setSubIndicators] = createSignal({});

  const [timezoneModalVisible, setTimezoneModalVisible] = createSignal(false);
  const [timezone, setTimezone] = createSignal<SelectDataSourceItem>({
    key: props.timezone,
    text: translateTimezone(props.timezone, props.locale),
  });

  const [settingModalVisible, setSettingModalVisible] = createSignal(false);
  const [widgetDefaultStyles, setWidgetDefaultStyles] = createSignal<Styles>();

  const [screenshotUrl, setScreenshotUrl] = createSignal("");

  const [drawingBarVisible, setDrawingBarVisible] = createSignal(
    props.drawingBarVisible
  );

  const [symbolSearchModalVisible, setSymbolSearchModalVisible] =
    createSignal(false);

  const [loadingVisible, setLoadingVisible] = createSignal(false);

  const [indicatorSettingModalParams, setIndicatorSettingModalParams] =
    createSignal({
      visible: false,
      indicatorName: "",
      paneId: "",
      calcParams: [] as Array<any>,
    });

  props.ref({
    setTheme,
    getTheme: () => theme(),
    setStyles,
    getStyles: () => widget!.getStyles(),
    setLocale,
    getLocale: () => locale(),
    setTimezone: (timezone: string) => {
      setTimezone({
        key: timezone,
        text: translateTimezone(props.timezone, locale()),
      });
    },
    getTimezone: () => timezone().key,
    setSymbol,
    getSymbol: () => symbol(),
    setPeriod,
    getPeriod: () => period(),
    createTrade: (trade: TradesData) => {
      createTrade(trade);
    },
    toggleSearchSymbolModal: () => {
      setSymbolSearchModalVisible(true);
    },
  });

  const documentResize = () => {
    widget?.resize();
  };

  const adjustFromTo = (period: Period, toTimestamp: number, count: number) => {
    let to = toTimestamp;
    let from = to;
    switch (period.timespan) {
      case "second": {
        to = to - (to % 1000);
        from = to - count * period.multiplier * 1000;
        break;
      }
      case "minute": {
        to = to - (to % (60 * 1000));
        from = to - count * period.multiplier * 60 * 1000;
        break;
      }
      case "hour": {
        to = to - (to % (60 * 60 * 1000));
        from = to - count * period.multiplier * 60 * 60 * 1000;
        break;
      }
      case "day": {
        to = to - (to % (60 * 60 * 1000));
        from = to - count * period.multiplier * 24 * 60 * 60 * 1000;
        break;
      }
      case "week": {
        const date = new Date(to);
        const week = date.getDay();
        const dif = week === 0 ? 6 : week - 1;
        to = to - dif * 60 * 60 * 24;
        const newDate = new Date(to);
        to = new Date(
          `${newDate.getFullYear()}-${
            newDate.getMonth() + 1
          }-${newDate.getDate()}`
        ).getTime();
        from = count * period.multiplier * 7 * 24 * 60 * 60 * 1000;
        break;
      }
      case "month": {
        const date = new Date(to);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        to = new Date(`${year}-${month}-01`).getTime();
        from = count * period.multiplier * 30 * 24 * 60 * 60 * 1000;
        const fromDate = new Date(from);
        from = new Date(
          `${fromDate.getFullYear()}-${fromDate.getMonth() + 1}-01`
        ).getTime();
        break;
      }
      case "year": {
        const date = new Date(to);
        const year = date.getFullYear();
        to = new Date(`${year}-01-01`).getTime();
        from = count * period.multiplier * 365 * 24 * 60 * 60 * 1000;
        const fromDate = new Date(from);
        from = new Date(`${fromDate.getFullYear()}-01-01`).getTime();
        break;
      }
    }
    return [from, to];
  };

  onMount(() => {
    window.addEventListener("resize", documentResize);
    widget = init(widgetRef!, {
      customApi: {
        formatDate: (
          dateTimeFormat: Intl.DateTimeFormat,
          timestamp,
          format: string,
          type: FormatDateType
        ) => {
          const p = period();
          switch (p.timespan) {
            case "second": {
              if (type === FormatDateType.XAxis) {
                return utils.formatDate(dateTimeFormat, timestamp, "HH:mm:ss");
              }
              return utils.formatDate(
                dateTimeFormat,
                timestamp,
                "YYYY-MM-DD HH:mm:ss"
              );
            }
            case "minute": {
              if (type === FormatDateType.XAxis) {
                return utils.formatDate(dateTimeFormat, timestamp, "HH:mm");
              }
              return utils.formatDate(
                dateTimeFormat,
                timestamp,
                "YYYY-MM-DD HH:mm"
              );
            }
            case "hour": {
              if (type === FormatDateType.XAxis) {
                return utils.formatDate(
                  dateTimeFormat,
                  timestamp,
                  "MM-DD HH:mm"
                );
              }
              return utils.formatDate(
                dateTimeFormat,
                timestamp,
                "YYYY-MM-DD HH:mm"
              );
            }
            case "day":
            case "week":
              return utils.formatDate(dateTimeFormat, timestamp, "YYYY-MM-DD");
            case "month": {
              if (type === FormatDateType.XAxis) {
                return utils.formatDate(dateTimeFormat, timestamp, "YYYY-MM");
              }
              return utils.formatDate(dateTimeFormat, timestamp, "YYYY-MM-DD");
            }
            case "year": {
              if (type === FormatDateType.XAxis) {
                return utils.formatDate(dateTimeFormat, timestamp, "YYYY");
              }
              return utils.formatDate(dateTimeFormat, timestamp, "YYYY-MM-DD");
            }
          }
          return utils.formatDate(
            dateTimeFormat,
            timestamp,
            "YYYY-MM-DD HH:mm"
          );
        },
      },
    });

    if (widget) {
      const watermarkContainer = widget.getDom("candle_pane", DomPosition.Main);
      if (watermarkContainer) {
        let watermark = document.createElement("div");
        watermark.className = "klinecharts-pro-watermark";
        if (utils.isString(props.watermark)) {
          const str = (props.watermark as string).replace(/(^\s*)|(\s*$)/g, "");
          watermark.innerHTML = str;
        } else {
          watermark.appendChild(props.watermark as Node);
        }
        watermarkContainer.appendChild(watermark);
      }

      const priceUnitContainer = widget.getDom(
        "candle_pane",
        DomPosition.YAxis
      );

      priceUnitDom = document.createElement("span");
      priceUnitDom.className = "klinecharts-pro-price-unit";
      priceUnitContainer?.appendChild(priceUnitDom);
    }

    mainIndicators().forEach((indicator) => {
      if (indicator == "MA") {
        createIndicator(widget, indicator, true, { id: "candle_pane" }, [9]);
      } else {
        createIndicator(widget, indicator, true, { id: "candle_pane" });
      }
    });
    const subIndicatorMap = {};
    props.subIndicators!.forEach((indicator) => {
      const paneId = createIndicator(widget, indicator, true);
      if (paneId) {
        // @ts-expect-error
        subIndicatorMap[indicator] = paneId;
      }
    });
    setSubIndicators(subIndicatorMap);
    widget?.loadMore((timestamp) => {
      loading = true;
      const get = async () => {
        const p = period();
        const [to] = adjustFromTo(p, timestamp!, 1);
        const [from] = adjustFromTo(p, to, 100);
        const kLineDataList = await props.datafeed.getHistoryKLineData(
          symbol(),
          p,
          from,
          to
        );
        widget?.applyMoreData(kLineDataList, kLineDataList.length > 0);
        loading = false;
      };
      get();
    });
    widget?.subscribeAction(ActionType.OnTooltipIconClick, (data) => {
      if (data.indicatorName) {
        switch (data.iconId) {
          case "visible": {
            widget?.overrideIndicator(
              { name: data.indicatorName, visible: true },
              data.paneId
            );
            break;
          }
          case "invisible": {
            widget?.overrideIndicator(
              { name: data.indicatorName, visible: false },
              data.paneId
            );
            break;
          }
          case "setting": {
            const indicator = widget?.getIndicatorByPaneId(
              data.paneId,
              data.indicatorName
            ) as Indicator;
            setIndicatorSettingModalParams({
              visible: true,
              indicatorName: data.indicatorName,
              paneId: data.paneId,
              calcParams: indicator.calcParams,
            });
            break;
          }
          case "close": {
            if (data.paneId === "candle_pane") {
              const newMainIndicators = [...mainIndicators()];
              widget?.removeIndicator("candle_pane", data.indicatorName);
              newMainIndicators.splice(
                newMainIndicators.indexOf(data.indicatorName),
                1
              );
              localStorage.setItem(
                "mainIndicators",
                JSON.stringify(newMainIndicators)
              );
              setMainIndicators(newMainIndicators);
            } else {
              const newIndicators = { ...subIndicators() };
              widget?.removeIndicator(data.paneId, data.indicatorName);
              // @ts-expect-error
              delete newIndicators[data.indicatorName];
              const names = Object.keys(newIndicators);
              localStorage.setItem("subIndicators", JSON.stringify(names));
              setSubIndicators(newIndicators);
            }
          }
        }
      }
    });
  });

  onCleanup(() => {
    window.removeEventListener("resize", documentResize);
    dispose(widgetRef!);
  });

  createEffect(() => {
    const s = symbol();
    if (s?.priceCurrency) {
      priceUnitDom.innerHTML = s?.priceCurrency.toLocaleUpperCase();
      priceUnitDom.style.display = "flex";
    } else {
      priceUnitDom.style.display = "none";
    }

    widget?.setPriceVolumePrecision(
      s?.pricePrecision ?? 2,
      s?.volumePrecision ?? 0
    );
  });

  createEffect((prev?: PrevSymbolPeriod) => {
    if (!loading) {
      if (prev) {
        props.datafeed.unsubscribe(prev.symbol, prev.period);
      }
      const s = symbol();
      const p = period();
      loading = true;
      setLoadingVisible(true);

      // Track the current candle
      let currentCandle: any = null;

      const get = async () => {
        const [from, to] = adjustFromTo(p, new Date().getTime(), 100);
        const kLineDataList = await props.datafeed.getHistoryKLineData(
          s,
          p,
          from,
          to
        );
        if (kLineDataList.length > 0) {
          const data = kLineDataList[kLineDataList.length - 1];
          widget?.overrideOverlay({
            name: "customOverlayCustomFigure",
            visible: true,
            points: [
              {
                timestamp: data?.timestamp,
                value: data?.close,
              },
            ],
          });
        }
        widget?.applyNewData(kLineDataList, kLineDataList.length > 0);

        // Initialize current candle from the last data point if available
        if (kLineDataList && kLineDataList.length > 0) {
          currentCandle = { ...kLineDataList[kLineDataList.length - 1] };
        }

        props.datafeed.subscribe(s, p, (data) => {
          if (data) {
            // For Countdown timer for price line location
            // console.log("data", data);
            // setLastDataPoint({ timestamp: data.timestamp, close: data.close });
            // updateCountdown(data.timestamp, data.close);

            // For countdown timer for latest candle stick location with spacing
            widget?.overrideOverlay({
              name: "customOverlayCustomFigure",
              points: [
                {
                  timestamp: data?.timestamp,
                  value: data?.close,
                },
              ],
            });
          }
          if (!currentCandle || currentCandle.timestamp !== data.timestamp) {
            let data2 = data;
            if (currentCandle) {
              data2 = {
                open: currentCandle.close,
                high: currentCandle.close,
                low: currentCandle.close,
                close: currentCandle.close,
                volume: data.volume,
                timestamp: data.timestamp,
              };
            }
            currentCandle = { ...data2 };

            widget?.updateData(currentCandle);
          } else {
            // Same candle period, update the existing candle
            // Keep the original open
            currentCandle.high = Math.max(currentCandle.high, data.high);
            currentCandle.low = Math.min(currentCandle.low, data.low);
            currentCandle.close = data.close;

            // Handle volume - assuming each update contains the incremental volume
            if (data.volume !== undefined) {
              currentCandle.volume =
                (currentCandle.volume || 0) + (data.volume || 0);
            }

            widget?.updateData(currentCandle);
          }
        });

        loading = false;
        setLoadingVisible(false);
      };
      get();
      return { symbol: s, period: p };
    }
    return prev;
  });

  createEffect(() => {
    widget?.setOffsetRightDistance(100);
    const t = theme();
    widget?.setStyles(t);
    const color = t === "dark" ? "#999999" : "#76808F";
    widget?.setStyles({
      indicator: {
        tooltip: {
          icons: [
            {
              id: "visible",
              position: TooltipIconPosition.Middle,
              marginLeft: 8,
              marginTop: 3,
              marginRight: 0,
              marginBottom: 0,
              paddingLeft: 0,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              icon: "\ue903",
              fontFamily: "icomoon",
              size: 14,
              color: color,
              activeColor: color,
              backgroundColor: "transparent",
              activeBackgroundColor: "rgba(22, 119, 255, 0.15)",
            },
            {
              id: "invisible",
              position: TooltipIconPosition.Middle,
              marginLeft: 8,
              marginTop: 3,
              marginRight: 0,
              marginBottom: 0,
              paddingLeft: 0,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              icon: "\ue901",
              fontFamily: "icomoon",
              size: 14,
              color: color,
              activeColor: color,
              backgroundColor: "transparent",
              activeBackgroundColor: "rgba(22, 119, 255, 0.15)",
            },
            {
              id: "setting",
              position: TooltipIconPosition.Middle,
              marginLeft: 6,
              marginTop: 3,
              marginBottom: 0,
              marginRight: 0,
              paddingLeft: 0,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              icon: "\ue902",
              fontFamily: "icomoon",
              size: 14,
              color: color,
              activeColor: color,
              backgroundColor: "transparent",
              activeBackgroundColor: "rgba(22, 119, 255, 0.15)",
            },
            {
              id: "close",
              position: TooltipIconPosition.Middle,
              marginLeft: 6,
              marginTop: 3,
              marginRight: 0,
              marginBottom: 0,
              paddingLeft: 0,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              icon: "\ue900",
              fontFamily: "icomoon",
              size: 14,
              color: color,
              activeColor: color,
              backgroundColor: "transparent",
              activeBackgroundColor: "rgba(22, 119, 255, 0.15)",
            },
          ],
        },
      },
    });
  });

  // Countdown timer for price line yaxis location
  // let countdownRef: HTMLDivElement | undefined;
  // function updateCountdown(timestamp: number, close: number) {
  //   // const countdownDiv = document.getElementById("countdown");
  //   if (countdownRef && timestamp && close) {
  //     const coord: any = widget?.convertToPixel(
  //       {
  //         timestamp: timestamp,
  //         value: close,
  //       },
  //       { paneId: "candle_pane" }
  //     );
  //     if (coord) {
  //       const container = document.getElementById("chart-container");
  //       const containerWidth = container?.clientWidth;
  //       const paddingRight = 58;
  //       if (containerWidth) {
  //         countdownRef.style.right = `${2}px`;
  //         countdownRef.style.top = `${coord.y + 48}px`;
  //       }
  //     }
  //   }
  // }
  // createEffect(() => {
  //   const data = widget?.getDataList()[widget.getDataList().length - 1];
  //   if (data) {
  //     setLastDataPoint({ timestamp: data.timestamp, close: data.close });
  //     updateCountdown(data.timestamp, data.close);
  //   }
  //   let baseInterval = 1000;
  //   const candleStickInterval = getCandleStickInterval(period(), baseInterval);
  //   // Set up an interval to run this effect every second
  //   const intervalId = setInterval(() => {
  //     const now = Date.now();
  //     const timeLeft = formatTimerText(
  //       candleStickInterval - (now % candleStickInterval)
  //     );

  //     // const countdownDiv = document.getElementById("countdown");
  //     if (countdownRef) {
  //       countdownRef.innerHTML = timeLeft;
  //     }
  //   }, 1000); // Run every 500ms (0.5 second)

  //   // Clean up the interval when the component is destroyed
  //   onCleanup(() => {
  //     clearInterval(intervalId);
  //   });
  // });
  // // Store the latest timestamp and close values

  // let animationFrameId: number | null = null;

  // // Update the countdown position continuously
  // createEffect(() => {
  //   // Set up a high-frequency interval to update position
  //   const updatePositionLoop = () => {
  //     const { timestamp, close } = lastDataPoint();
  //     if (timestamp && close) {
  //       updateCountdown(timestamp, close);
  //     }
  //     // Request next frame
  //     animationFrameId = requestAnimationFrame(updatePositionLoop);
  //   };
  //   animationFrameId = requestAnimationFrame(updatePositionLoop);

  //   // Clean up when component is destroyed
  //   onCleanup(() => {
  //     if (animationFrameId !== null) {
  //       cancelAnimationFrame(animationFrameId);
  //     }
  //   });
  // });

  // createEffect(() => {

  //
  // });

  // Old Timer Logic
  createEffect(() => {
    let baseInterval = 1000;
    const candleStickInterval = getCandleStickInterval(period(), baseInterval);
    // Set up an interval to run this effect every second
    const intervalId = setInterval(() => {
      const now = Date.now() - 500;
      const timeLeft = formatTimerText(
        candleStickInterval - (now % candleStickInterval)
      );

      // Override overlay to show time left
      widget?.overrideOverlay({
        name: "customOverlayCustomFigure",
        extendData: `${timeLeft}`,
      });
    }, 200); // Run every 500ms (0.5 second)

    // Clean up the interval when the component is destroyed
    onCleanup(() => {
      clearInterval(intervalId);
    });

    // 1. Register countdown rectangle figure
    registerFigure({
      name: "countdownRectangle",
      draw: (ctx, attrs, styles) => {
        const { x, y, width, height, remainingSeconds, offsetX } = attrs;
        const { baseColor, warningColor, textColor, borderRadius } = styles;
        const color = remainingSeconds <= 10 ? warningColor : baseColor;
        const adjustedX = x + offsetX;

        const left = adjustedX - width / 2;
        const top = y - height / 2;
        const radius = borderRadius;

        ctx.beginPath();
        ctx.moveTo(left + radius, top);
        ctx.lineTo(left + width - radius, top);
        ctx.quadraticCurveTo(left + width, top, left + width, top + radius);
        ctx.lineTo(left + width, top + height - radius);
        ctx.quadraticCurveTo(
          left + width,
          top + height,
          left + width - radius,
          top + height
        );
        ctx.lineTo(left + radius, top + height);
        ctx.quadraticCurveTo(left, top + height, left, top + height - radius);
        ctx.lineTo(left, top + radius);
        ctx.quadraticCurveTo(left, top, left + radius, top);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = textColor || "#ffffff";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(remainingSeconds.toString(), adjustedX, y);
      },
      checkEventOn: (coordinate, attrs) => {
        const { x, y } = coordinate;
        const adjustedX = attrs.x + attrs.offsetX;
        const left = adjustedX - attrs.width / 2;
        const top = attrs.y - attrs.height / 2;
        return (
          x >= left &&
          x <= left + attrs.width &&
          y >= top &&
          y <= top + attrs.height
        );
      },
    });

    // 2. Register overlay
    registerOverlay({
      name: "customOverlayCustomFigure",
      totalStep: 2,
      createPointFigures: ({ coordinates, overlay, xAxis }) => {
        const elapsed = Math.floor(
          (Date.now() - overlay.extendData.startTime) / 1000
        );
        const remaining = overlay.extendData;

        const barSpacing = 3; // default bar space if not provided
        const offsetX = barSpacing * 25; // move 6 bars to the right

        return {
          type: "countdownRectangle",
          attrs: {
            x: coordinates[0].x,
            y: coordinates[0].y,
            width: 50,
            height: 20,
            remainingSeconds: remaining,
            offsetX: offsetX,
          },
          styles: {
            baseColor: "#1d2da8",
            warningColor: "#e53935",
            textColor: "#ffffff",
            borderRadius: 3,
          },
        };
      },
    });
    // Create the overlay
    widget?.createOverlay({
      name: "customOverlayCustomFigure",
      points: [{ timestamp: new Date().getTime(), value: 0 }],
      lock: true,
      onRightClick: () => {
        return true;
      },
      visible: false,
      extendData: 5,
    });
  }, [symbol().name, period().text]);

  createEffect(() => {
    widget?.setLocale(locale());
  });

  createEffect(() => {
    widget?.setTimezone(timezone().key);
  });

  createEffect(() => {
    if (styles()) {
      widget?.setStyles(styles());
      setWidgetDefaultStyles(lodashClone(widget!.getStyles()));
    }
  });

  const createTrade = (trade: TradesData) => {
    console.log(trade);
    // 1. Register countdown rectangle figure

    // 1) Rectangle countdown (unchanged)
    registerFigure({
      name: `tradeRectangle-${trade.ticketNo}`,
      draw: (ctx, attrs: any, styles: any) => {
        const { x, y, width, height, remainingSeconds, offsetX } = attrs;
        const { borderRadius = 8, textColor = "#fff" } = styles;
        const adjustedX = x + offsetX;
        const left = adjustedX - width / 2;
        const top = y - height / 2;
        const r = borderRadius;

        // path
        ctx.beginPath();
        ctx.moveTo(left + r, top);
        ctx.lineTo(left + width - r, top);
        ctx.quadraticCurveTo(left + width, top, left + width, top + r);
        ctx.lineTo(left + width, top + height - r);
        ctx.quadraticCurveTo(
          left + width,
          top + height,
          left + width - r,
          top + height
        );
        ctx.lineTo(left + r, top + height);
        ctx.quadraticCurveTo(left, top + height, left, top + height - r);
        ctx.lineTo(left, top + r);
        ctx.quadraticCurveTo(left, top, left + r, top);
        ctx.closePath();

        // dashed border
        ctx.save();
        // ctx.strokeStyle = "#fff";
        // ctx.lineWidth = 1;
        // ctx.setLineDash([4, 2]);
        // ctx.stroke();
        // ctx.restore();

        ctx.fillStyle = trade.tradeDirection == "up" ? "#15803D" : "#E53935";
        ctx.fill();

        // text
        ctx.fillStyle = textColor;
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(remainingSeconds.toString(), adjustedX, y);
      },
      checkEventOn: (coord: any, attrs: any) => {
        const { x, y } = coord;
        const adjustedX = attrs.x + attrs.offsetX;
        const left = adjustedX - attrs.width / 2;
        const top = attrs.y - attrs.height / 2;
        return (
          x >= left &&
          x <= left + attrs.width &&
          y >= top &&
          y <= top + attrs.height
        );
      },
    });

    registerFigure({
      name: `infiniteRightLine-${trade.ticketNo}`,
      draw: (ctx, attrs: any, styles: any) => {
        const { x, offsetX, y } = attrs;
        const { color = "#2DC08E", lineWidth = 2 } = styles;

        const startX = x + offsetX;
        const endX = ctx.canvas.width;

        ctx.save();

        // Draw the horizontal line
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();

        // Draw outer circle (same color as line)
        const outerRadius = 6;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(startX, y, outerRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw inner circle (white)
        const innerRadius = 3;
        ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        ctx.arc(startX, y, innerRadius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
      },
      checkEventOn: () => false,
    });

    // 3) Overlay: return both shapes
    registerOverlay({
      name: `tradeOverlay-${trade.ticketNo}`,
      totalStep: 2,
      createPointFigures: ({ coordinates, overlay }) => {
        const baseX = coordinates[0].x;
        const baseY = coordinates[0].y;
        const barSpacing = 18;
        const barsRight = -5;
        const offsetX = barSpacing * barsRight;

        // overlay.extendData should be an object like:
        // { text: "Trade Time", countdown: "00:30" }
        const { text, countdown } = overlay.extendData as any;

        // Combine text + countdown into one string if you wish:
        const remaining = `${text} ${countdown}`;

        return [
          {
            type: `tradeRectangle-${trade.ticketNo}`,
            attrs: {
              x: baseX,
              y: baseY,
              width: 85,
              height: 25,
              remainingSeconds: remaining,
              offsetX,
            },
            styles: {
              textColor: "#fff",
              borderRadius: 6,
            },
          },
          {
            type: `infiniteRightLine-${trade.ticketNo}`, // must match the registered figure name
            attrs: {
              x: baseX,
              y: baseY,
              width: 1000,
              height: 1,
              offsetX: 0,
            },
            styles: {
              color: trade.tradeDirection == "up" ? "#2DC08E" : "#E53935",

              lineWidth: 1,
            },
          },
        ];
      },
    });
    // const arrowText = trade.tradeDirection === "up" ? "⇡" : "⇣";
    console.log(new Date(trade.openingTime));
    // 1. Register countdown rectangle figure
    const datapoint = widget?.getDataList()[widget.getDataList().length - 1];
    // Create the overlay
    widget?.createOverlay({
      name: `tradeOverlay-${trade.ticketNo}`,
      points: [
        {
          timestamp: datapoint?.timestamp
            ? datapoint.timestamp
            : new Date(trade.openingTime).getTime(),
          value: trade.openingPrice!,
        },
      ],
      lock: true,
      onRightClick: () => {
        return true;
      },
      extendData: {
        text: `$${trade.openingPrice} `,
        countdown: "00:00",
      },
    });

    const intervalId = setInterval(() => {
      const now = Date.now();
      const timeLeft = formatTimerText(
        new Date(trade.closingTime).getTime() - now
      );
      widget?.overrideOverlay({
        name: `tradeOverlay-${trade.ticketNo}`,
        extendData: {
          text: `$${trade.openingPrice} `,
          countdown: timeLeft,
        },
      });
      if (timeLeft === "00:00") {
        widget?.removeOverlay({ name: `tradeOverlay-${trade.ticketNo}` });
        clearInterval(intervalId);
      }
    }, 1000);
    onCleanup(() => {
      clearInterval(intervalId);
    });
  };

  return (
    <>
      <i class="icon-close klinecharts-pro-load-icon" />
      {/* <div
        id="countdown"
        class="countdown"
        ref={(el) => (countdownRef = el)}
        style={{
          position: "absolute",
          color: "white",
          "font-family": "Helvetica Neue",
          "font-size": "11px",
          "pointer-events": "none",
          "background-color": "#1d2da8",
          padding: "3px 6px",
          "font-weight": "bold",
          width: "54px",
          "text-align": "center",
          "border-radius": "4px",
          display: "inline-block",
          "z-index": "10",
        }}
      >
        00:00
      </div> */}
      <div
        class="custom-button"
        onClick={() => {
          widget?.scrollToRealTime();
          widget?.setOffsetRightDistance(90);
        }}
      >
        →
      </div>
      <div
        class="custom-button"
        style={{ right: "0" }}
        onClick={() => {
          createTrade({
            ticketNo: "12345",
            symbol: "AAPL",
            currency: "USD",
            tradeDirection: "up",
            amountInvested: 100,
            openingPrice: 144.497,
            closingPrice: null,
            openingTime: new Date().getTime(),
            closingTime: new Date().getTime() + 10000,
            isComplete: false,
            pnlValue: 0,
            accountNo: "12345",
            payout: 1.5,
          });
        }}
      >
        trade
      </div>
      <Show when={symbolSearchModalVisible()}>
        <SymbolSearchModal
          locale={props.locale}
          datafeed={props.datafeed}
          onSymbolSelected={(symbol) => {
            setSymbol(symbol);
          }}
          onClose={() => {
            setSymbolSearchModalVisible(false);
          }}
        />
      </Show>
      <Show when={indicatorModalVisible()}>
        <IndicatorModal
          locale={props.locale}
          mainIndicators={mainIndicators()}
          subIndicators={subIndicators()}
          onClose={() => {
            setIndicatorModalVisible(false);
          }}
          onMainIndicatorChange={(data) => {
            const newMainIndicators = [...mainIndicators()];
            if (data.added) {
              if (data.name == "MA") {
                createIndicator(
                  widget,
                  data.name,
                  true,
                  { id: "candle_pane" },
                  [9]
                );
              } else {
                createIndicator(widget, data.name, true, { id: "candle_pane" });
              }
              newMainIndicators.push(data.name);
            } else {
              widget?.removeIndicator("candle_pane", data.name);
              newMainIndicators.splice(newMainIndicators.indexOf(data.name), 1);
            }
            localStorage.setItem(
              "mainIndicators",
              JSON.stringify(newMainIndicators)
            );
            setMainIndicators(newMainIndicators);
          }}
          onSubIndicatorChange={(data) => {
            const newSubIndicators = { ...subIndicators() };
            if (data.added) {
              const paneId = createIndicator(widget, data.name);
              if (paneId) {
                // @ts-expect-error
                newSubIndicators[data.name] = paneId;
              }
            } else {
              if (data.paneId) {
                widget?.removeIndicator(data.paneId, data.name);
                // @ts-expect-error
                delete newSubIndicators[data.name];
              }
            }
            const names = Object.keys(newSubIndicators);
            localStorage.setItem("subIndicators", JSON.stringify(names));
            setSubIndicators(newSubIndicators);
          }}
        />
      </Show>
      {/* <Show when={timezoneModalVisible()}>
        <TimezoneModal
          locale={props.locale}
          timezone={timezone()}
          onClose={() => {
            setTimezoneModalVisible(false);
          }}
          onConfirm={setTimezone}
        />
      </Show> */}
      <Show when={settingModalVisible()}>
        <SettingModal
          locale={props.locale}
          currentStyles={utils.clone(widget!.getStyles())}
          onClose={() => {
            setSettingModalVisible(false);
          }}
          onChange={(style) => {
            widget?.setStyles(style);
          }}
          onRestoreDefault={(options: SelectDataSourceItem[]) => {
            const style = {};
            options.forEach((option) => {
              const key = option.key;
              lodashSet(
                style,
                key,
                utils.formatValue(widgetDefaultStyles(), key)
              );
            });
            widget?.setStyles(style);
          }}
        />
      </Show>
      <Show when={screenshotUrl().length > 0}>
        <ScreenshotModal
          locale={props.locale}
          url={screenshotUrl()}
          onClose={() => {
            setScreenshotUrl("");
          }}
        />
      </Show>
      <Show when={indicatorSettingModalParams().visible}>
        <IndicatorSettingModal
          locale={props.locale}
          params={indicatorSettingModalParams()}
          onClose={() => {
            setIndicatorSettingModalParams({
              visible: false,
              indicatorName: "",
              paneId: "",
              calcParams: [],
            });
          }}
          onConfirm={(params) => {
            const modalParams = indicatorSettingModalParams();
            widget?.overrideIndicator(
              { name: modalParams.indicatorName, calcParams: params },
              modalParams.paneId
            );
          }}
        />
      </Show>

      <PeriodBar
        locale={props.locale}
        symbol={symbol()}
        spread={drawingBarVisible()}
        period={period()}
        periods={props.periods}
        currentStyles={props.styles}
        onChartStyleChange={(style) => {
          widget?.setStyles(style);
        }}
        onMenuClick={async () => {
          try {
            await startTransition(() =>
              setDrawingBarVisible(!drawingBarVisible())
            );
            widget?.resize();
          } catch (e) {}
        }}
        onSymbolClick={() => {
          setSymbolSearchModalVisible(!symbolSearchModalVisible());
        }}
        onPeriodChange={(props) => {
          localStorage.setItem("period", JSON.stringify(props));
          setPeriod(props);
        }}
        onIndicatorClick={() => {
          setIndicatorModalVisible((visible) => !visible);
        }}
        onTimezoneClick={() => {
          setTimezoneModalVisible((visible) => !visible);
        }}
        onSettingClick={() => {
          setSettingModalVisible((visible) => !visible);
        }}
        // onScreenshotClick={() => {
        //   if (widget) {
        //     const url = widget.getConvertPictureUrl(
        //       true,
        //       "jpeg",
        //       props.theme === "dark" ? "#151517" : "#ffffff"
        //     );
        //     setScreenshotUrl(url);
        //   }
        // }}
      />

      <div class="klinecharts-pro-content">
        <Show when={loadingVisible()}>
          <Loading />
        </Show>
        <Show when={drawingBarVisible()}>
          <DrawingBar
            locale={props.locale}
            onDrawingItemClick={(overlay) => {
              widget?.createOverlay(overlay);
            }}
            onModeChange={(mode) => {
              widget?.overrideOverlay({ mode: mode as OverlayMode });
            }}
            onLockChange={(lock) => {
              widget?.overrideOverlay({ lock });
            }}
            onVisibleChange={(visible) => {
              widget?.overrideOverlay({ visible });
            }}
            onRemoveClick={(groupId) => {
              widget?.removeOverlay({ groupId });
            }}
          />
        </Show>
        <div
          ref={widgetRef}
          class="klinecharts-pro-widget"
          id="chart-container"
          data-drawing-bar-visible={drawingBarVisible()}
        />
      </div>
    </>
  );
};

export default ChartProComponent;
