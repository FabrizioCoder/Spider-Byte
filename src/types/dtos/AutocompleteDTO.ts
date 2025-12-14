export interface AutocompleteDTO {
    readonly data: AutocompleteUserDTO[];
}

export interface AutocompleteUserDTO {
    // readonly platformId: number;
    // readonly platformSlug: string;
    readonly platformUserIdentifier: string;
    // readonly platformUserId: null;
    readonly platformUserHandle: string;
    // readonly avatarUrl: string;
    // readonly titleUserId: null;
    // readonly status: null;
    // readonly additionalParameters: null;
    // readonly metadata: null;
}
