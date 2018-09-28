import { Injectable } from "@angular/core";
import * as moment from 'moment';
import { Observable, forkJoin } from "rxjs";
import { ChartDataService } from "./chart-data.service";
import { ChartDatasetService } from "./chart-dataset.service";
import { ChartYaxesService } from "./chart-yaxes.service";
import { first } from "rxjs/operators";

@Injectable()
export class ChartConfigService {
  chartConfig;
  isCurrent = false;


  constructor(private chartDataService: ChartDataService,
    private chartDatasetService: ChartDatasetService,
    private chartYaxesService: ChartYaxesService) { }

  /**
   * Get the sensor config to use in the chart from the return observable.
   * If config is already stored then it just returns stored data.  If not
   * then it tries to read from other services to get the data, datasets and
   * yAxes.  Then stitches thoses pieces together into a sensor config, then
   * pushes to local storage and returns data through observable.
   *
   * @param {number} buildingid a number representing the id for the building.
   * @returns {Observable} an observable that returns a configuration object if
   * the buiding id is found.  Otherwise it returns an Observable error.
   */
  getChartConfig(buildingid: number): Observable<any> {
    return new Observable(obs => {
      if(this.chartConfig && this.chartConfig.buildingid == buildingid && this.isCurrent){
        obs.next(this.chartConfig);
      } else {


        forkJoin(
          this.chartDataService.getChartData(buildingid),
          this.chartDatasetService.getChartDataset(buildingid),
        ).subscribe(
          ([data, dataset]) => {


            //get the default template and load the building id into it.
            this.chartConfig = this.getConfigTemplate();
            this.chartConfig['buildingid'] = buildingid;

            //load the template with the obserable data.
            this.chartConfig.data.labels = data['createddate'];
            this.chartConfig.data.datasets = dataset['datasets'];
            this.chartConfig.options.scales.yAxes = this.chartYaxesService.getAllChartYaxes();

            //load the data into each dataset based off the sensorcode from the dataset
            this.chartConfig.data.datasets.forEach(set => {
              const sensorcodes = set.sensorcode.split("_");

              //check the sensorcode to see how to add to the config object
              if(sensorcodes.length > 1){ //more then one code then it is a useage or demand
                set['data'] = data[sensorcodes[0]][sensorcodes[1]];
              } else if(sensorcodes.length === 1) { //one code means it is a temperature like sensor
                set['data'] = data[sensorcodes[0]];
              }
            });

            this.isCurrent = true;
            setTimeout(()=> {
              this.isCurrent = false;
            }, 14 * 60 * 1000); //in 14 minutes they have to get a new config.

            obs.next(this.chartConfig);
          },
          error => console.log("ChartConfigService: observable error", error)
        );
      }
      //this will make observable auto close after the first instance of ether next() or error()
    }).pipe(first());
  }




  /**
   * Get the chart configuration template to add data to from other services.
   * @returns {object} a template for configration.
   */
  private getConfigTemplate() {
    return {

      buildingid: -1,
      type: 'line',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        maintainAspectRatio: false,
        layout:{
          padding:{
            left: 50,
            right: 50,
            top: 20,
            bottom: 20
          }
        },
        lineHeight: 1,
        responsive: true,
        hover: {
          mode: 'nearest',
          intersect: true
        },
        legend:{
          display:false
        },
        title: {
          display: false,
          text: 'Default'
        },
        scales: {
          yAxes: [],
          xAxes: [{
            ticks: {
              maxTicksLimit: 10,
              autoSkip: true,
              callback: function (value, index, values) {
                const dt = new Date(value);
                return moment(value).format('ddd h:mm a');
              }
            }
          }]
        }
      }
    };
  }
}


