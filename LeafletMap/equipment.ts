import { Asset, EquipmentType, equipmentTypes, safeImageUrl } from "./data";
import DOMPurify from "dompurify";

export const typeLabels: Record<EquipmentType, string> = {
    "haul-truck": "Haul truck", loader: "Loader", "water-cart": "Water cart", grader: "Grader", dozer: "Dozer", crusher: "Crusher",
};
const drawings: Record<EquipmentType, string> = {
    "haul-truck": '<path d="M8 13h28l-5 16H13z"/><path d="M36 22h10l8 10v9H31V29h5z"/><path d="M40 25h5l5 7H40z" fill="#c8e0df"/><path d="M9 35h25v6H9z"/><circle cx="18" cy="41" r="7"/><circle cx="45" cy="41" r="7"/>',
    loader: '<path d="M17 24h22v16H12V30z"/><path d="M25 13h13l4 17H23z"/><path d="M28 16h7l3 11H26z" fill="#c8e0df"/><path d="m14 28-8 8H2v10h13l7-9M39 28l13 9v7H40"/><circle cx="24" cy="42" r="7"/><circle cx="45" cy="42" r="7"/>',
    "water-cart": '<rect x="5" y="17" width="32" height="21" rx="9" fill="#69b6c5"/><path d="M38 23h9l8 10v9H35V29z"/><path d="M41 26h4l6 7H41z" fill="#c8e0df"/><circle cx="16" cy="41" r="7"/><circle cx="45" cy="41" r="7"/>',
    grader: '<path d="M6 32h47v6H6zM27 15h12v19H25zM21 37l15 8-19 2z"/><path d="M29 18h7v11h-7z" fill="#c8e0df"/><circle cx="10" cy="41" r="6"/><circle cx="39" cy="41" r="6"/><circle cx="51" cy="41" r="6"/>',
    dozer: '<path d="M12 25h30v14H9zM24 13h14l5 18H21z"/><path d="M27 16h8l3 12H25z" fill="#c8e0df"/><path d="m43 29 10-6v24H43z"/><rect x="6" y="35" width="38" height="13" rx="6" fill="#344544"/><path d="M12 41h26" stroke="#d0d8d6"/>',
    crusher: '<path d="M8 15h43l-9 18H17zM20 33h20v12H20zM4 44h50v5H4z"/><path d="m40 34 15-9v7l-15 9"/><path d="M15 21h30M21 26h18" stroke="#344544"/>',
};
export function equipmentSvg(type: EquipmentType): string {
    return `<svg viewBox="0 0 60 60" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g fill="#efb94e" stroke="#263b38" stroke-width="1.8" stroke-linejoin="round">${drawings[type]}</g></svg>`;
}
export function fuelTone(value: number | null | undefined): string {
    return value == null ? "unknown" : value <= 20 ? "low" : value <= 40 ? "warning" : "normal";
}
export function assetLabel(asset: Asset): string {
    const label = equipmentTypes.includes(asset.type as EquipmentType) ? typeLabels[asset.type as EquipmentType] : asset.type;
    return [asset.name, label === "marker" ? "" : label, asset.status, asset.fuelPercent == null ? "" : `fuel ${asset.fuelPercent}%`].filter(Boolean).join(", ");
}
export function markerContent(asset: Asset, selected: boolean, template = "", images: Record<string, string> = {}): HTMLElement {
    const imageUrl = asset.imageUrl || (asset.imageKey ? images[asset.imageKey] : undefined);
    if (template.trim()) return templateMarker(asset, selected, template, imageUrl);
    if (!equipmentTypes.includes(asset.type as EquipmentType)) {
        const marker = document.createElement("div");
        marker.className = `generic-marker${selected ? " is-selected" : ""}`;
        if (imageUrl) { const img = document.createElement("img"); img.src = imageUrl; img.alt = ""; marker.append(img); }
        else marker.textContent = asset.name.charAt(0).toUpperCase();
        return marker;
    }
    const root = document.createElement("div");
    root.className = `mine-marker mine-marker--${fuelTone(asset.fuelPercent)}${selected ? " is-selected" : ""}`;
    root.style.setProperty("--fuel", `${(asset.fuelPercent ?? 0) * 3.6}deg`);
    const face = document.createElement("div");
    face.className = "mine-marker__face";
    const icon = document.createElement("span");
    icon.className = "mine-marker__equipment";
    // Only trusted local SVG enters innerHTML; record-driven strings use textContent.
    icon.innerHTML = equipmentSvg(asset.type as EquipmentType);
    if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = "";
        image.referrerPolicy = "strict-origin-when-cross-origin";
        image.addEventListener("error", () => image.remove(), { once: true });
        icon.append(image);
    }
    const fuel = document.createElement("span");
    fuel.className = "mine-marker__fuel";
    fuel.textContent = asset.fuelPercent == null ? "—" : `${Math.round(asset.fuelPercent)}%`;
    const status = document.createElement("span");
    status.className = `mine-marker__status mine-marker__status--${asset.status}`;
    face.append(icon, fuel);
    root.append(face, status);
    return root;
}

// Record values become text nodes; image URLs have a dedicated validated placeholder.
function templateMarker(asset: Asset, selected: boolean, template: string, imageUrl?: string): HTMLElement {
    const marker = document.createElement("div");
    marker.className = `custom-marker${selected ? " is-selected" : ""}`;
    const clean = DOMPurify.sanitize(template, { RETURN_DOM_FRAGMENT: true,
        ALLOWED_TAGS: ["div", "span", "p", "strong", "b", "em", "i", "small", "img", "br"],
        ALLOWED_ATTR: ["class", "style", "title", "alt", "src"], ALLOW_DATA_ATTR: false });
    const values: Record<string, unknown> = { ...asset.fields, id: asset.id, name: asset.name, type: asset.type,
        status: asset.status, fuelPercent: asset.fuelPercent, latitude: asset.latitude, longitude: asset.longitude };
    const walker = document.createTreeWalker(clean, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        node.textContent = (node.textContent ?? "").replace(/\{\{\s*([\w.-]+)\s*\}\}/g,
            (_match, key: string) => Object.prototype.hasOwnProperty.call(values, key) ? String(values[key] ?? "") : "");
    }
    clean.querySelectorAll("*").forEach((element) => {
        // Dynamic placeholders are deliberately unsupported in attributes other than image src.
        for (const attr of Array.from(element.attributes)) {
            if (attr.value.includes("{{") && !(element.tagName === "IMG" && attr.name === "src" && attr.value.trim() === "{{imageUrl}}")) element.removeAttribute(attr.name);
        }
        if (element.tagName === "IMG") {
            const img = element as HTMLImageElement;
            const source = img.getAttribute("src") === "{{imageUrl}}" ? imageUrl : safeImageUrl(img.getAttribute("src"));
            if (source) { img.src = source; img.referrerPolicy = "strict-origin-when-cross-origin"; }
            else img.removeAttribute("src");
        }
    });
    marker.append(clean);
    return marker;
}
