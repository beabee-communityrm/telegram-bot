export const cleanUrl = (url: string): string => {
    return url.replaceAll('//', '/');
}