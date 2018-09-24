import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { first, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment'
import { HttpClient, HttpErrorResponse, } from '@angular/common/http';
import { forEach } from "@angular/router/src/utils/collection";

@Injectable()
export class ChartDataService {
  chartData =[];
  maxTicks = 7 * 24 * 4;
  //maxTicks = 10;

  constructor(private http: HttpClient) { }

  getChartData(buildingid: number) {
    return new Observable(obs => {
      const data = this.chartData.find(d => d.buildingid === buildingid);

      if (data) {
        obs.next(data);
      } else {

        //get observable from http module
        this.http.get(environment.serverURL + `/api/chart-data/building/${buildingid}/ticks/${this.maxTicks + 1}`)
          .pipe(
            first(),
            catchError(this.handleError)
          )
          .subscribe(
            results => {

              //run through all the keys in the results object
              for(let key in results){

                //if it has a sub key of usage then send it to the generate demand function.
                if(results[key]['usage']){ //check if there is a useage.
                  results[key]['demand'] = []; //create a new array for demand
                  this.generateDemand(results[key].usage, results[key].demand, results['createddate']);
                }
              }

              //remove the first instance from the array.
              results['createddate'].splice(0, 1);

              //push onto local varable for later use.
              this.chartData.push(results);

              //return the observable data
              obs.next(results);
            },
            error => console.log("ChartDataService: error with get for building = " + buildingid)
          );
      }
      //this will make observable auto close after the first instance of ether next() or error()
    }).pipe(first());
  }

  /**
   * Generates a demand array by altering the demand array.
   * Both the time and usage array must be the same length.
   * After function runs the demand array will be
   * @param usage an array of usage from the server.
   * @param demand a calculated array to be altered by this function.
   * @param time an array of times from the server.
   */
  generateDemand(usage:number[], demand:number[], time:number[]){
    let i = demand.length;

    //if demand has no length then push on a zero
    if(!demand.length){
      demand.push(0);
    }

    for(let i = demand.length; i < usage.length; i++){
      let usageDiff = usage[i] - usage[i-1];
      const timeDiff = (time[i] - time[i-1])/1000/60/60; //convert time difference to hours
      demand.push(usageDiff/timeDiff);
    }
    //remove one from both the usage and demand
    demand.splice(0,1);
    usage.splice(0, 1);
  }

  /**
   * Gets the temperature array for the building.  Last number in the array is the current temperature.
   * Build a watch on array for changes.
   * Tries three times to retrieve the building temperature array before sending an Observable error.
   * @param buildingid a number for the building id.
   * @returns observable that ether contains the array of temperatures or an error after three attempts.
   */
  getTemperatureArray(buildingid: number): Observable<any> {
    return new Observable(obs => {
      let data;
      let tries = 0;
      //create a loop that checks the data every ten seconds if not present.
      timeout();

      //looping function if no data is found.
      function timeout() {
        data = this.chartData.find(d => d.buildingid === buildingid);
        if (!data) {
          if (tries++ < 3) {
            setTimeout(timeout, 10000);
          } else {
            obs.error("Tried 3 times to retrieve data without results.  Building not supported or server error.")
          }
        } else {
          obs.next(data.temperature);
        }
      }
    });
  }

  /**
   * Handle Observable errors.  Todo: need to make a logging report
   * @param err error from an observable
   */
  private handleError(err: HttpErrorResponse) {
    let errorMessage = "";

    //todo: implement a error loging service here
    if (err.error instanceof ErrorEvent) {
      errorMessage = "An error has occured: " + err.error.message;
    } else {
      errorMessage = `Server returned code: ${err.status}, error message is: ${err.message}`;
    }
    return throwError(errorMessage);
  }
}

/**
 * Mock data to use while testing
 */
const mockServiceData = [{
  buildingid: 31,
  createddate: [2, 1, 3],
  electrical: {
    usage: [5, 6, 5],
    demand: [100, 75, 50]
  },
  naturalgas: {
    usage: [50, 60, 100],
    demand: [4, 20, 15]
  },
  water: {
    usage: [24, 23, 20],
    demand: [1, 2, 3]
  },
  temperature: [50, 55, 54]
}, {
  buildingid: 41,
  createddate: [2, 1, 3],
  electrical: {
    usage: [5, 6, 5],
    demand: [100, 75, 50]
  },
  naturalgas: {
    usage: [50, 60, 100],
    demand: [4, 20, 15]
  },
  water: {
    usage: [24, 23, 20],
    demand: [1, 2, 3]
  },
  temperature: [50, 55, 54]
}];
