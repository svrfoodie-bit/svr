import toast from 'react-hot-toast';

export const showFallbackError = (error, fallbackMessage) => {
  if (error?.__toastHandled) {
    return;
  }

  toast.error(error?.message || fallbackMessage);
};
