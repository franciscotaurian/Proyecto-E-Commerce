// Format currency to Argentine Peso
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0';

    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
};

// Format number with thousand separators
export const formatNumber = (num) => {
    return new Intl.NumberFormat('es-AR').format(num);
};

// Format date
export const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
};

// Format date with time
export const formatDateTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

export default {
    formatCurrency,
    formatNumber,
    formatDate,
    formatDateTime,
};
