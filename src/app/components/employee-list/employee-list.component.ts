import { Component, OnInit, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employee, Department, FilterOptions } from '../../models/employee.model';
import { EmployeeService } from '../../service/employee.service';
import { ValidationUtils } from '../../utils/validation.utils';
import { StatisticsWidgetComponent } from '../statistics-widget/statistics-widget.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, StatisticsWidgetComponent],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.css'
})
export class EmployeeListComponent implements OnInit {
  @Output() editEmployee = new EventEmitter<Employee>();


  currentView = signal<'all' | 'departments' | 'department-detail' | 'new-hires'>('all');
  selectedDepartment = signal<string>('');
  viewTitle = signal<string>('All Employees');


  filters = signal<FilterOptions>({
    search: '',
    department: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });


  departments = Object.values(Department);
  showDeleteModal = false;
  employeeToDelete: Employee | null = null;
  isExporting = false;

  constructor(public employeeService: EmployeeService) { }

  ngOnInit(): void {
    console.log('EmployeeListComponent initialized');
  }



  showAllEmployees(): void {
    this.currentView.set('all');
    this.viewTitle.set('All Employees');
    this.selectedDepartment.set('');
    this.filters.update(f => ({ ...f, department: '', search: '' }));
  }

  showDepartmentList(): void {
    this.currentView.set('departments');
    this.viewTitle.set('Departments');
    this.selectedDepartment.set('');
    this.filters.update(f => ({ ...f, search: '' }));
  }

  showDepartmentEmployees(department: string): void {
    this.currentView.set('department-detail');
    this.viewTitle.set(`Department: ${department}`);
    this.selectedDepartment.set(department);
    this.filters.update(f => ({ ...f, department: '', search: '' }));
  }

  showNewHiresThisMonth(): void {
    this.currentView.set('new-hires');
    this.viewTitle.set('New Hires This Month');
    this.selectedDepartment.set('');
    this.filters.update(f => ({ ...f, department: '', search: '' }));
  }

  onStatClick(event: { type: string; data?: any }): void {
    console.log('Stat clicked:', event.type);

    switch (event.type) {
      case 'total':
        this.showAllEmployees();
        break;

      case 'departments':
        this.showDepartmentList();
        break;

      case 'new-this-month':
        this.showNewHiresThisMonth();
        break;
    }
  }




  displayedEmployees = computed(() => {
    let employees = this.employeeService.allEmployees();
    const currentFilters = this.filters();

    console.log('=== FILTERING DEBUG ===');
    console.log('Total employees:', employees.length);
    console.log('Current view:', this.currentView());
    console.log('Selected department:', this.selectedDepartment());
    console.log('Search filter:', currentFilters.search);
    console.log('Department filter:', currentFilters.department);


    switch (this.currentView()) {
      case 'department-detail':
        employees = employees.filter(emp => emp.department === this.selectedDepartment());
        console.log('After department detail filter:', employees.length);
        break;

      case 'new-hires':
        employees = this.getNewHiresThisMonth();
        console.log('After new hires filter:', employees.length);
        break;
    }


    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      employees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower)
      );
      console.log('After search filter:', employees.length);
    }


    if (currentFilters.department && this.currentView() === 'all') {
      employees = employees.filter(emp => emp.department === currentFilters.department);
      console.log('After dropdown department filter:', employees.length);
    }


    employees.sort((a, b) => {
      let aValue: any, bValue: any;

      if (currentFilters.sortBy === 'name') {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else {
        aValue = new Date(a.dateOfJoining);
        bValue = new Date(b.dateOfJoining);
      }

      if (aValue < bValue) return currentFilters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return currentFilters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    console.log('Final employee count:', employees.length);
    console.log('=== END DEBUG ===');

    return employees;
  });

  getDepartmentStats() {
    const employees = this.employeeService.allEmployees();
    const departmentMap = new Map<string, number>();

    employees.forEach(emp => {
      departmentMap.set(emp.department, (departmentMap.get(emp.department) || 0) + 1);
    });

    const total = employees.length;

    return Array.from(departmentMap.entries()).map(([department, count]) => ({
      department,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }


  getNewHiresThisMonth(): Employee[] {
    const employees = this.employeeService.allEmployees();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return employees.filter(emp => {
      const joinDate = new Date(emp.dateOfJoining);
      return joinDate.getMonth() === currentMonth &&
        joinDate.getFullYear() === currentYear;
    });
  }



  onSearchChange(searchTerm: string): void {
    this.filters.update(filters => ({ ...filters, search: searchTerm }));
  }

  onDepartmentChange(department: string): void {
    this.filters.update(filters => ({ ...filters, department }));
  }

  onSortChange(sortBy: 'name' | 'dateOfJoining'): void {
    this.filters.update(filters => ({
      ...filters,
      sortBy,
      sortOrder: filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  }

  confirmDelete(employee: Employee): void {
    this.employeeToDelete = employee;
    this.showDeleteModal = true;
  }

  deleteEmployee(): void {
    if (this.employeeToDelete) {
      this.employeeService.deleteEmployee(this.employeeToDelete.id);
      this.showDeleteModal = false;
      this.employeeToDelete = null;
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.employeeToDelete = null;
  }

  onEditEmployee(employee: Employee): void {
    this.editEmployee.emit(employee);
  }

  exportToCSV(): void {
    this.isExporting = true;

    try {
      const csvContent = this.employeeService.exportToCSV();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      this.isExporting = false;
    }
  }

  getSortIcon(column: 'name' | 'dateOfJoining'): string {
    const currentFilters = this.filters();
    if (currentFilters.sortBy !== column) return 'fas fa-sort';
    return currentFilters.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  getFormattedDate(date: string): string {
    return ValidationUtils.getFormattedDate(date);
  }

  get totalDisplayedEmployees(): number {
    return this.displayedEmployees().length;
  }
}