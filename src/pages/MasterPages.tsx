import { CrudPage } from './CrudPage';
import {
  categorySchema,
  chamberSchema,
  customerSchema,
  locationSchema,
  productSchema,
  rackSchema,
  supplierSchema,
  unitSchema,
} from '../validation/schemas';

export function CustomersPage() {
  return (
    <CrudPage
      title="Customers"
      subtitle="Depositors who store goods in your chambers"
      endpoint="/customers"
      queryKey="customers"
      createPermission="customer.create"
      deletePermission="customer.delete"
      schema={customerSchema}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'businessName', label: 'Business' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'city', label: 'City' },
        { key: 'status', label: 'Status' },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'businessName', label: 'Business name' },
        { name: 'mobile', label: 'Mobile', required: true },
        { name: 'email', label: 'Email' },
        { name: 'city', label: 'City' },
        { name: 'state', label: 'State' },
        { name: 'gstin', label: 'GSTIN' },
      ]}
    />
  );
}

export function SuppliersPage() {
  return (
    <CrudPage
      title="Suppliers"
      subtitle="Vendors and service partners"
      endpoint="/suppliers"
      queryKey="suppliers"
      createPermission="supplier.create"
      deletePermission="supplier.delete"
      schema={supplierSchema}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'gstin', label: 'GSTIN' },
        { key: 'status', label: 'Status' },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'mobile', label: 'Mobile', required: true },
        { name: 'email', label: 'Email' },
        { name: 'gstin', label: 'GSTIN' },
        { name: 'address', label: 'Address', type: 'textarea' },
      ]}
    />
  );
}

export function CategoriesPage() {
  return (
    <CrudPage
      title="Categories"
      subtitle="Product groups used on inventory items"
      endpoint="/categories"
      queryKey="categories"
      createPermission="category.create"
      deletePermission="category.delete"
      schema={categorySchema}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
    />
  );
}

export function UnitsPage() {
  return (
    <CrudPage
      title="Units"
      subtitle="Quantity units such as KG, MT, and BAG"
      endpoint="/units"
      queryKey="units"
      createPermission="unit.create"
      deletePermission="unit.delete"
      schema={unitSchema}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'code', label: 'Code', required: true },
      ]}
    />
  );
}

export function ProductsPage() {
  return (
    <CrudPage
      title="Products"
      subtitle="Commodities stored for customers"
      endpoint="/products"
      queryKey="products"
      createPermission="product.create"
      deletePermission="product.delete"
      schema={productSchema}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'categoryId', label: 'Category' },
        { key: 'unitId', label: 'Unit' },
        { key: 'status', label: 'Status' },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'categoryId', label: 'Category', type: 'select', endpoint: '/categories' },
        { name: 'unitId', label: 'Unit', type: 'select', endpoint: '/units' },
        { name: 'hsn', label: 'HSN' },
        { name: 'storageType', label: 'Storage type' },
        { name: 'defaultRate', label: 'Default rate', type: 'number' },
      ]}
    />
  );
}

export function ChambersPage() {
  return (
    <CrudPage
      title="Chambers"
      subtitle="Cold rooms with live occupancy"
      endpoint="/chambers"
      queryKey="chambers"
      createPermission="chamber.create"
      deletePermission="chamber.delete"
      schema={chamberSchema}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'capacity', label: 'Capacity' },
        { key: 'occupiedCapacity', label: 'Occupied' },
        { key: 'availableCapacity', label: 'Available' },
        { key: 'occupancyPercent', label: 'Occupancy %' },
        { key: 'status', label: 'Status' },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'code', label: 'Code' },
        { name: 'capacity', label: 'Capacity (MT)', type: 'number', required: true, defaultValue: 1000 },
        { name: 'temperature', label: 'Temperature', type: 'number', defaultValue: -18 },
        { name: 'location', label: 'Location note' },
      ]}
    />
  );
}

export function RacksPage() {
  return (
    <CrudPage
      title="Racks"
      subtitle="Racks inside a chamber"
      endpoint="/racks"
      queryKey="racks"
      createPermission="rack.create"
      deletePermission="rack.delete"
      schema={rackSchema}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'chamberId', label: 'Chamber' },
        { key: 'capacity', label: 'Capacity' },
        { key: 'occupiedCapacity', label: 'Occupied' },
        { key: 'status', label: 'Status' },
      ]}
      fields={[
        { name: 'chamberId', label: 'Chamber', type: 'select', endpoint: '/chambers', required: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'code', label: 'Code' },
        { name: 'capacity', label: 'Capacity', type: 'number', required: true, defaultValue: 500 },
      ]}
    />
  );
}

export function LocationsPage() {
  return (
    <CrudPage
      title="Locations"
      subtitle="Pick faces used when allocating stock"
      endpoint="/locations"
      queryKey="locations"
      createPermission="location.create"
      deletePermission="location.delete"
      schema={locationSchema}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'chamberId', label: 'Chamber' },
        { key: 'rackId', label: 'Rack' },
        { key: 'section', label: 'Section' },
        { key: 'capacity', label: 'Capacity' },
        { key: 'occupiedCapacity', label: 'Occupied' },
        { key: 'status', label: 'Status' },
      ]}
      fields={[
        { name: 'chamberId', label: 'Chamber', type: 'select', endpoint: '/chambers', required: true },
        { name: 'rackId', label: 'Rack', type: 'select', endpoint: '/racks', required: true, dependsOn: 'chamberId', dependParam: 'chamberId' },
        { name: 'section', label: 'Section', defaultValue: 'S01' },
        { name: 'capacity', label: 'Capacity', type: 'number', required: true, defaultValue: 250 },
      ]}
    />
  );
}
