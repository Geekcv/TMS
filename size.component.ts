import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApicontrollerService } from 'src/app/controllers/apicontroller.service';

@Component({
  selector: 'app-testing-size',
  templateUrl: './testing-size.component.html',
  styleUrls: ['./testing-size.component.css']
})
export class TestingSizeComponent {

  selectedCustomer: string = '';
  selectedProduct: string = '';
  customerOptions: any = {
    name: '',
    placeholder: 'Select Supply Type',
    css: 'w-20rem',
    options: [] as string[]
  };

  classes: any[] = [];
  products: any[] = [];
  rows: any[] = [];

  constructor(private router: Router, private apiController: ApicontrollerService) {
    this.supplyTypeDetails();
    this.classDetails();
    this.fetchProducts();
  }

  // Method to add a new row
  addNewRow() {
    let row = [
      {
        name: 'product',
        selectedOption: '',
        options: this.products
      }
    ];

    // Adding class options to the row
    for (let cls of this.classes) {
      row.push({
        name: cls.row_id,
        selectedOption: '',
        options: [] // Initially empty; will be populated based on product selection
      });
    }

    this.rows.push(row);
  }

  // Handle input change for customer selection
  handleInputChangeCustomer(value: string) {
    this.selectedCustomer = value;
    console.log("Customer selected:", value);
  }

  // Handle input change for each row
  handleInputChange(value: string, name: string, index: number) {
    console.log("Input changed:", value, name, index);
    
    if (name === 'product') {
      // Update selected product in the row
      this.rows[index].forEach((item: any) => {
        if (item.name === 'product') {
          item.selectedOption = value;
        }
      });

      // Fetch size details based on the selected product
      if (value) {
        this.sizeDetails(value, index);
      } else {
        // If no product is selected, clear size selections for that row
        this.clearSizeSelections(index);
      }
      
    } else {
      // Update selected option for other fields in the row
      this.rows[index].forEach((item: any) => {
        if (item.name === name) {
          item.selectedOption = value;
        }
      });
    }
  }

  // Clear size selections when product is deselected
  clearSizeSelections(index: number) {
    this.rows[index].forEach((item: any) => {
      if (item.name !== 'product') {
        item.selectedOption = ''; // Clear the selection
        item.options = []; // Optionally clear available options as well
      }
    });
  }

  async supplyTypeDetails() {
    try {
      const response = await this.apiController.getSupplyTypeDetails().toPromise();
      this.customerOptions.options = response;
    } catch (error) {
      console.error('Error fetching supply type details:', error);
    }
  }

  async classDetails() {
    try {
      const response = await this.apiController.getClassDetails().toPromise();
      this.classes = response;
    } catch (error) {
      console.error('Error fetching class details:', error);
    }
  }

  async fetchProducts() {
    try {
      const response = await this.apiController.getProducts().toPromise();
      this.products = response;
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  async sizeDetails(value: string, index: number) {
    try {
      const response = await this.apiController.getSizeDetails(value).toPromise();
      
      // Update size options based on the selected product
      this.rows[index].forEach((item: any) => {
        if (item.name !== 'product') {
          item.options = response; // Set available sizes based on product selection
        }
      });
      
    } catch (error) {
      console.error('Error fetching size details:', error);
    }
  }

  async fetchData() {
    try {
      const response = await this.apiController.fetchData().toPromise();
      this.rows = response;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async submit() {
    try {
      const data = this.rows.map((row: any) => {
        let classes: any[] = [];
        let product_row_id: string = '';

        row.forEach((item: any) => {
          if (item.name === 'product') {
            product_row_id = item.selectedOption;
          } else {
            classes.push({
              class_row_id: item.name,
              size_row_id: item.selectedOption
            });
          }
        });

        return { product_row_id, classes };
      });

      console.log('Data:', data);
      console.log('Selected Customer:', this.selectedCustomer);

      const sizeData = {
        customer_type_row_id: this.selectedCustomer,
        data: data
      };

      const resp: any = await this.apiController.updatePriceForCustomerType(sizeData).toPromise();
      console.log('Submission response:', resp);

      // Redirect or handle success
      this.router.navigate(['/success-page']); 

    } catch (error) {
      console.error('Error during submission:', error);
    }
  }
}