import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import * as XLSX from 'xlsx';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TemplateService } from '../../shared/services/template.service';
import { AuthenticationService } from '../../shared/services/authentication.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { TableCellErrorDialogsComponent } from '../../shared/dialogs/table-cell-error-dialogs/table-cell-error-dialogs.component';

type AOA = any[][];
@Component({
  selector: 'app-validation-result',
  templateUrl: './validation-result.component.html',
  styleUrls: ['./validation-result.component.scss'],
})
export class ValidationResultComponent implements OnInit {

  highlight: boolean = false;
  data: MatTableDataSource<any> | undefined;
  columnNames: any;
  result: any;
  row: any;
  length: any;
  sheetarr: any;
  wsname: any;
  wbfile: any;
  errorIndex:number = -1;
  basicErrorsList:Array<Object> = [];
  a: any;
  fileName: string = 'SheetJS.xlsx';
  errors: any
  selectedSheet: any;
  headers: any;
  isUserLogin: any = false;
  columnIdentifier:any;
  statusClass:any ='not-active';
state:any = true;

  constructor(private route: ActivatedRoute,private toastr: ToastrService,public dialog: MatDialog, private router: Router, private templateService: TemplateService, private authService: AuthenticationService) { }


  /**
   * Set the paginator after the view init since this component will
   * be able to query its view for the initialized paginator.
   */
  ngOnInit(): void {
  
   this.errors = this.templateService.templateError
    this.onFileChange(this.templateService.templateFile)
    this.isUserLogin = this.authService.isUserLoggedIn();

  }

  copyToClipBoard(error1:any,error2:any) {
    navigator.clipboard.writeText(error1 ? error1 : '' +error2 ? error2 : '').then(() => {
      this.toastr.success('Error copied successfully.','Success')
      /* Resolved - text copied to clipboard successfully */
    },() => {
      console.error('Failed to copy');
      /* Rejected - text failed to copy to the clipboard */
    });
  }

  capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  onLogout() {
    this.authService.logoutAccount();
    this.isUserLogin = false;
    this.router.navigate(['/auth/login'])
  }

  getOpenStatus(status?:boolean) {
    return status ? !status : false;
  }

  openDialog(error1:any,error2:any) {
    const dialogRef = this.dialog.open(TableCellErrorDialogsComponent, {
      data: {content:error1 ? error1 : '' +error2 ? error2 : ''},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  onFileChange(evt: any) {
    if(!this.errors){
      this.router.navigate(['/template/template-selection'])
    }
    // const target: DataTransfer = <DataTransfer>evt.target;
    const target: DataTransfer = <DataTransfer>evt;
    const reader: FileReader = new FileReader();

    this.readFile(target, reader).subscribe((output) => { });
    
  }


  isBasicError(column: any, ele: any, row:any,index:number) {
    if(this.basicErrorsList.length) {
      return (this.basicErrorsList.find((element:any) => element.rowNumber == (index) && this.columnIdentifier[column] == element.columnName) ? true : false)
    }
    else {
      return false;
    }
  }

  getErrorsList(column: any,index:number) {

    if(this.errorIndex >= 0 && this.errors.advancedErrors.data[this.errorIndex].rowNumber.includes(index) && this.errors.advancedErrors.data[this.errorIndex].columnName == this.columnIdentifier[column]) {
      return this.errors.advancedErrors.data[this.errorIndex].errMessage
    }

  }
  
  getBasicErrors(column: any,index:number) {
    let item
    if(this.basicErrorsList.length) {
      item = this.basicErrorsList.map((element:any) => {
        if(element.rowNumber == (index) && this.columnIdentifier[column] == element.columnName) {
          return element.errMessage;
        }
      }).filter((element) => element)
    }
    return item
  }
  isAdvancedError(column: any, ele: any, row:any,index:number) {
    // console.log(index,this.paginator.page,this.paginator.pageIndex,this.paginator.pageSize,this.paginator.pageSizeOptions)
    if(this.errorIndex >= 0) {
      return this.errors.advancedErrors.data[this.errorIndex].rowNumber.includes(index) && this.errors.advancedErrors.data[this.errorIndex].columnName == this.columnIdentifier[column];
    }
  }


  readFile(target: DataTransfer, reader: FileReader): Observable<string> {
    const sub = new Subject<string>();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      this.wbfile = wb;
      this.sheetarr = wb.SheetNames;
      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      /* save data */
      const data: any = XLSX.utils.sheet_to_json(ws);
      sub.next(data);
      sub.complete();
      this.onClickSheetName(wb.SheetNames[1])

    };

    reader.readAsBinaryString(target.files[0]);
    
    return sub.asObservable();
  }
  isSlectedSheet(s: any){
    if(s==this.selectedSheet){
      return true;
    }else{
      return false
    }
  
   
  }
  onClickSheetName(s: any) {
  
    const wsname: string = s;
    const ws: XLSX.WorkSheet = this.wbfile.Sheets[wsname];
    const data: any = XLSX.utils.sheet_to_json(ws);
    this.headers = data[0]
    this.columnIdentifier = data[0]
    
    this.columnNames = Object.keys(data[0]);
    this.data = new MatTableDataSource(data);
    // this.data.paginator = this.paginator;
    this.selectedSheet = s;

   this.errorIndex = this.errors.advancedErrors.data.findIndex((item:any) => item.sheetName == this.selectedSheet)
   this.basicErrorsList = this.errors.basicErrors.data.filter((item:any) => item.sheetName == this.selectedSheet);
  

    // console.log(this.errorIndex);
  }
  firstRow(index:any){
    if(index == 0){
      console.log(index)
      return true
    }else{
      return false
    }
  }
  export(): void {
    XLSX.writeFile(this.wbfile, `$file.xlsx`);
  }



}



