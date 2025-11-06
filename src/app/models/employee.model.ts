export interface Employee {
  id: string;
  name: string;
  email: string;
  department: Department;
  dateOfJoining: string;
  createdAt: string;
  updatedAt: string;
}

export enum Department {
  HR = 'HR',
  ENGINEERING = 'Engineering',
  SALES = 'Sales',
  MARKETING = 'Marketing',
  FINANCE = 'Finance',
  OPERATIONS = 'Operations',
  PRODUCT = 'Product',
  DESIGN = 'Design'
}

export interface EmployeeFormData {
  name: string;
  email: string;
  department: Department;
  dateOfJoining: string;
}

export interface FilterOptions {
  search: string;
  department: string;
  sortBy: 'name' | 'dateOfJoining';
  sortOrder: 'asc' | 'desc';
}