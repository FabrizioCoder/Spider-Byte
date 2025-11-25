
export interface MapsDTO {
    readonly total_maps: number;
    readonly maps: MapDTO[];
}

export interface MapDTO {
    readonly id: number;
    readonly name: string;
    readonly full_name: string;
    readonly location: string;
    readonly description?: string;
    readonly game_mode: string;
    readonly video: string | null;
    readonly images: string[];
}
