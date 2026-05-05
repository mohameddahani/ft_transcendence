import { CreateProductDto } from './create-product.dto';
import { PartialType } from '@nestjs/mapped-types';

// on update mode all elemets should be optional
export class UpdateProductDto extends PartialType(CreateProductDto) {}
