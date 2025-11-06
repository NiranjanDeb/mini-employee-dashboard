import { computed, Injectable, signal } from '@angular/core';
import { Department, Employee, EmployeeFormData, FilterOptions } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  private readonly STORAGE_KEY = 'employee_dashboard_data';

  private employees = signal<Employee[]>(this.loadFromLocalStorage());

  totalEmployees = computed(() => this.employees().length);

  constructor() {
     if (this.employees().length === 0) {
      this.initializeSampleData();
    }
   }

   allEmployees = computed(() => this.employees());

     // Get employees with filtering and sorting
  getFilteredEmployees(filters: FilterOptions) {
    return computed(() => {
      let filtered = [...this.employees()];

      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(emp => 
          emp.name.toLowerCase().includes(searchLower) ||
          emp.email.toLowerCase().includes(searchLower)
        );
      }

      // Apply department filter
      if (filters.department) {
        filtered = filtered.filter(emp => emp.department === filters.department);
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        if (filters.sortBy === 'name') {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        } else {
          aValue = new Date(a.dateOfJoining);
          bValue = new Date(b.dateOfJoining);
        }

        if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      return filtered;
    });
  }

  // Get employee by ID
  getEmployeeById(id: string): Employee | undefined {
    return this.employees().find(emp => emp.id === id);
  }

  // Add new employee
  addEmployee(employeeData: EmployeeFormData): void {
    const newEmployee: Employee = {
      ...employeeData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.employees.update(employees => [...employees, newEmployee]);
    this.saveToLocalStorage();
  }

  // Update existing employee
  updateEmployee(id: string, employeeData: EmployeeFormData): void {
    this.employees.update(employees => 
      employees.map(emp => 
        emp.id === id 
          ? { ...emp, ...employeeData, updatedAt: new Date().toISOString() }
          : emp
      )
    );
    this.saveToLocalStorage();
  }

  // Delete employee
  deleteEmployee(id: string): void {
    this.employees.update(employees => employees.filter(emp => emp.id !== id));
    this.saveToLocalStorage();
  }

  // Get department options
  getDepartments(): string[] {
    return Object.values(Department);
  }

  // Export to CSV
  exportToCSV(): string {
    const employees = this.employees();
    const headers = ['ID', 'Name', 'Email', 'Department', 'Date of Joining', 'Created At'];
    const csvData = employees.map(emp => [
      emp.id,
      emp.name,
      emp.email,
      emp.department,
      emp.dateOfJoining,
      emp.createdAt
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  // Private methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private loadFromLocalStorage(): Employee[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.employees()));
  }

  private initializeSampleData(): void {
    const sampleEmployees: EmployeeFormData[] = [
      {
        name: 'John Smith',
        email: 'john.smith@company.com',
        department: Department.ENGINEERING,
        dateOfJoining: '2023-01-15'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        department: Department.HR,
        dateOfJoining: '2022-08-01'
      },
      {
        name: 'Mike Chen',
        email: 'mike.chen@company.com',
        department: Department.SALES,
        dateOfJoining: '2023-03-22'
      }
    ];

    sampleEmployees.forEach(emp => this.addEmployee(emp));
  }



  // Add this method to your EmployeeService class
getEmployeeStatistics() {
  const employees = this.allEmployees();
  
  return {
    total: employees.length,
    departments: this.getUniqueDepartmentsCount(employees),
    newThisMonth: this.getNewHiresThisMonth(employees),
    averageTenure: this.getAverageTenure(employees),
    departmentDistribution: this.getDepartmentDistribution(employees)
  };
}

private getUniqueDepartmentsCount(employees: Employee[]): number {
  return new Set(employees.map(emp => emp.department)).size;
}

private getNewHiresThisMonth(employees: Employee[]): number {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return employees.filter(emp => {
    const joinDate = new Date(emp.dateOfJoining);
    return joinDate.getMonth() === currentMonth && 
           joinDate.getFullYear() === currentYear;
  }).length;
}

private getAverageTenure(employees: Employee[]): string {
  if (employees.length === 0) return '0';
  
  const totalMonths = employees.reduce((acc, emp) => {
    const joinDate = new Date(emp.dateOfJoining);
    const today = new Date();
    const months = (today.getFullYear() - joinDate.getFullYear()) * 12 + 
                  (today.getMonth() - joinDate.getMonth());
    return acc + Math.max(0, months);
  }, 0);
  
  const averageMonths = totalMonths / employees.length;
  
  if (averageMonths < 12) {
    return averageMonths.toFixed(1) + ' months';
  } else {
    return (averageMonths / 12).toFixed(1) + ' years';
  }
}

private getDepartmentDistribution(employees: Employee[]): { department: string; count: number; percentage: number }[] {
  const departmentMap = new Map<string, number>();
  
  employees.forEach(emp => {
    departmentMap.set(emp.department, (departmentMap.get(emp.department) || 0) + 1);
  });
  
  const total = employees.length;
  
  return Array.from(departmentMap.entries()).map(([department, count]) => ({
    department,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0
  })).sort((a, b) => b.count - a.count);
}
}
