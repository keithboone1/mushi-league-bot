
export function getApiHost(url: URL): string {
    const apiPort: () => string = () => {
        if (process.env.NODE_ENV === 'development') {
            return !!process.env.EXPRESS_PORT ? ':' + process.env.EXPRESS_PORT : ':3001';
        } else {
            return !!url.port ? ':' + url.port : '';
        }
    }
    // React Router won't properly check for X-Forwarded-For headers, so we have to assume it ourselves
    if (process.env.NODE_ENV !== 'development') {
        url.protocol = 'https:';
    }
    return `${url.protocol}//${url.hostname}${apiPort()}`;
}