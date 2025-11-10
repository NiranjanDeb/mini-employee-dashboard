import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeListComponent } from '../employee-list/employee-list.component';
import { EmployeeFormComponent } from '../employee-form/employee-form.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { Employee, EmployeeFormData } from '../../models/employee.model';
import { EmployeeService } from '../../service/employee.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, EmployeeListComponent, EmployeeFormComponent, ThemeToggleComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  currentView = signal<'list' | 'form'>('list');
  selectedEmployee = signal<Employee | null>(null);
  isEditMode = signal<boolean>(false);

  constructor(public employeeService: EmployeeService) { }


  showEmployeeList(): void {
    this.currentView.set('list');
    this.selectedEmployee.set(null);
    this.isEditMode.set(false);
  }

  showAddEmployeeForm(): void {
    this.currentView.set('form');
    this.selectedEmployee.set(null);
    this.isEditMode.set(false);
  }

  showEditEmployeeForm(employee: Employee): void {
    this.currentView.set('form');
    this.selectedEmployee.set(employee);
    this.isEditMode.set(true);
  }


  onSaveEmployee(employeeData: EmployeeFormData): void {
    if (this.isEditMode() && this.selectedEmployee()) {
      this.employeeService.updateEmployee(this.selectedEmployee()!.id, employeeData);
    } else {
      this.employeeService.addEmployee(employeeData);
    }
    this.showEmployeeList();
  }

  onCancelForm(): void {
    this.showEmployeeList();
  }


  get employeeForEdit(): Employee | undefined {
    return this.selectedEmployee() || undefined;
  }
}