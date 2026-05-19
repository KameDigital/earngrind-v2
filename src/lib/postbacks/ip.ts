import type { NextRequest } from "next/server";

function parseIpv4(value: string): number | null {
    const parts = value.split(".");
    if (parts.length !== 4) return null;

    let result = 0;
    for (const part of parts) {
        if (!/^\d{1,3}$/.test(part)) return null;
        const byte = Number(part);
        if (byte < 0 || byte > 255) return null;
        result = (result << 8) + byte;
    }

    return result >>> 0;
}

function ipv4InCidr(ip: string, cidr: string): boolean {
    const [range, bitsValue = "32"] = cidr.split("/");
    const bits = Number(bitsValue);
    const ipValue = parseIpv4(ip);
    const rangeValue = parseIpv4(range);
    if (ipValue === null || rangeValue === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;

    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (ipValue & mask) === (rangeValue & mask);
}

export function getRequestIp(req: NextRequest): string | null {
    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const value = forwardedFor || req.headers.get("x-real-ip")?.trim() || null;
    if (!value) return null;

    return parseIpv4(value) !== null || value.includes(":") ? value : null;
}

export function isIpAllowed(sourceIp: string | null, allowedRanges: string[] | null | undefined): boolean {
    const ranges = allowedRanges?.filter(Boolean) ?? [];
    if (ranges.length === 0) return true;
    if (!sourceIp) return false;

    return ranges.some((range) => {
        if (range.includes(":")) return sourceIp === range || range === "::/0";
        return ipv4InCidr(sourceIp, range);
    });
}
