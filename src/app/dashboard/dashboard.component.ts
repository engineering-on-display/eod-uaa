import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isDashboard;
  constructor(private router:Router) { }

  ngOnInit() {
    this.isDashboard = this.router.url === "/dashboard"
  }

}
