import { Injectable } from '@nestjs/common'

interface Product {
  id: number
  name: string
  price: number
}

@Injectable()
export class ProductsService {
  private readonly products: Product[] = [
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Mouse', price: 29 },
    { id: 3, name: 'Keyboard', price: 79 },
  ]

  findAll(): Product[] {
    return this.products
  }

  findById(id: number): Product | undefined {
    return this.products.find(p => p.id === id)
  }

  create(data: { name: string; price: number }): Product {
    const product: Product = { id: this.products.length + 1, ...data }
    this.products.push(product)
    return product
  }
}
