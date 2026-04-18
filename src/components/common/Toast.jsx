// Not needed if using react-hot-toast, but here's a wrapper if needed
import toast from 'react-hot-toast';

export const showSuccess = (message) => toast.success(message);
export const showError = (message) => toast.error(message);
export const showLoading = (message) => toast.loading(message);
export const dismissToast = () => toast.dismiss();