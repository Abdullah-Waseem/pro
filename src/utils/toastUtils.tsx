import toast from 'react-hot-toast';

interface ToastOptions {
  duration?: number;
  style?: React.CSSProperties;
}

const defaultToastStyle = {
  padding: '12px',
  background: '#1f2937', // Dark background
  color: '#fff', // White text
};

const defaultToastOptions: ToastOptions = {
  duration: 5000,
  style: defaultToastStyle,
};

export const showToast = {
  custom: (content: React.ReactNode, options?: ToastOptions) => {
    toast(
      (t) => (
        <div onClick={() => toast.dismiss(t.id)}>
          {content}
        </div>
      ),
      { ...defaultToastOptions, ...options }
    );
  },

  error: (message: string) => {
    toast.error(message, defaultToastOptions);
  },

  success: (message: string) => {
    toast.success(message, defaultToastOptions);
  }
};
