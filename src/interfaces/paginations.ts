export type IPaginationOptions = {
    page?: number;
    limit?: number;
    sortBy?: string | undefined;
    sortOrder?: string | undefined;
}
export const paginationFields = ["page", "limit", "sortBy", "sortOrder"];

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;