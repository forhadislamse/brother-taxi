// vehicle.interface.ts

// Pagination options
export interface IPaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Generic response for paginated data
export interface IGenericResponse<T> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
  data: T;
}

// Filters for vehicle search
export interface IVehicleFilters {
  searchTerm?: string;
  manufacturer?: string;
  model?: string;
  year?: number | string;
  color?: string;
  licensePlateNumber?: string;
  bh?: string;
  reversalCode?: string;
  isActive?: boolean | string;
}
