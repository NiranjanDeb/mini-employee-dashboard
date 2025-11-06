import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Department, Employee, EmployeeFormData } from '../../models/employee.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.css'
})
export class EmployeeFormComponent implements OnInit {
  @Input() employee?: Employee;
  @Input() isEditMode: boolean = false;
  @Output() save = new EventEmitter<EmployeeFormData>();
  @Output() cancel = new EventEmitter<void>();

  employeeForm!: FormGroup;
  departments = Object.values(Department);
  today = new Date().toISOString().split('T')[0];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    
    if (this.isEditMode && this.employee) {
      this.populateForm();
    }
  }

  private initializeForm(): void {
    this.employeeForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z\s]*$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      department: ['', Validators.required],
      dateOfJoining: ['', [
        Validators.required,
        this.futureDateValidator.bind(this)
      ]]
    });
  }

  private populateForm(): void {
    this.employeeForm.patchValue({
      name: this.employee?.name,
      email: this.employee?.email,
      department: this.employee?.department,
      dateOfJoining: this.employee?.dateOfJoining
    });
  }

  private futureDateValidator(control: any) {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return selectedDate > today ? { futureDate: true } : null;
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      const formData: EmployeeFormData = this.employeeForm.value;
      this.save.emit(formData);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.employeeForm.controls).forEach(key => {
      const control = this.employeeForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.employeeForm.get(fieldName);
    
    if (!field || !field.errors) return '';
    
    if (field.errors['required']) return 'This field is required';
    if (field.errors['minlength']) return 'Name must be at least 3 characters long';
    if (field.errors['email']) return 'Please enter a valid email address';
    if (field.errors['pattern']) return 'Name can only contain letters and spaces';
    if (field.errors['futureDate']) return 'Date of joining cannot be in the future';
    
    return 'Invalid value';
  }

  get title(): string {
    return this.isEditMode ? 'Edit Employee' : 'Add New Employee';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Update Employee' : 'Add Employee';
  }
}