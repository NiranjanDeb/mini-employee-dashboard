import { Component, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../service/employee.service';
import { Employee } from '../../models/employee.model';

@Component({
  selector: 'app-statistics-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics-widget.component.html',
  styleUrl: './statistics-widget.component.css'
})
export class StatisticsWidgetComponent {
  @Output() statClick = new EventEmitter<{ type: string; data?: any }>();

  // Computed statistics that react to employee data changes
  stats = computed(() => {
    const employees = this.employeeService.allEmployees();
    
    return [
      {
        label: 'Total Employees',
        value: employees.length,
        icon: 'fas fa-users',
        color: 'primary',
        description: 'All employees in system',
        type: 'total',
        clickable: true
      },
      {
        label: 'Departments',
        value: this.getUniqueDepartmentsCount(employees),
        icon: 'fas fa-building',
        color: 'info',
        description: 'Active departments',
        type: 'departments',
        clickable: true
      },
      {
        label: 'New This Month',
        value: this.getNewHiresThisMonth(employees),
        icon: 'fas fa-user-plus',
        color: 'success',
        description: 'Hired this month',
        type: 'new-this-month',
        clickable: true
      },
      {
        label: 'Avg Tenure',
        value: this.getAverageTenure(employees),
        icon: 'fas fa-calendar-alt',
        color: 'warning',
        description: 'Average months with company',
        type: 'avg-tenure',
        clickable: false
      }
    ];
  });

  departmentStats = computed(() => {
    const employees = this.employeeService.allEmployees();
    return this.getDepartmentDistribution(employees);
  });

  constructor(private employeeService: EmployeeService) {}

  onStatClick(stat: any): void {
    if (!stat.clickable) return;

    let data: any;

    switch (stat.type) {
      case 'total':
        // Show all employees
        data = { filter: 'all' };
        break;
      
      case 'departments':
        // Show department list
        data = { 
          filter: 'departments',
          departments: this.departmentStats()
        };
        break;
      
      case 'new-this-month':
        // Show employees hired this month
        data = { 
          filter: 'new-this-month',
          employees: this.getNewHiresThisMonthList()
        };
        break;
    }

    this.statClick.emit({
      type: stat.type,
      data: data
    });
  }

  private getUniqueDepartmentsCount(employees: Employee[]): number {
    const departments = new Set(employees.map(emp => emp.department));
    return departments.size;
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

  private getNewHiresThisMonthList(): Employee[] {
    const employees = this.employeeService.allEmployees();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return employees.filter(emp => {
      const joinDate = new Date(emp.dateOfJoining);
      return joinDate.getMonth() === currentMonth && 
             joinDate.getFullYear() === currentYear;
    });
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
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }

  // Helper method to get icon class
  getIconClass(stat: any): string {
    return `${stat.icon} text-${stat.color}`;
  }
}