export const cleanUrl = (url: string): string => {
    return url.replaceAll('//', '/');
}

export const getFilenameFromUrl = (url: string | URL) => {
    if (typeof url === 'string') {
        url = new URL(url);
    }
    const pathname = url.pathname;
    const filename = pathname.split('/').pop();
    return filename;
}

export const downloadImage = async (url: string | URL, path?: string) => {

    if (typeof url === 'string') {
        url = new URL(url);
    }
    if (!path) {
        const filename = getFilenameFromUrl(url);
        path = await Deno.makeTempDir();
        path = `${path}/${filename}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Es gab einen Fehler: ${response.statusText}`);

    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();

    await Deno.writeFile(path, new Uint8Array(buffer));

    return path;
}