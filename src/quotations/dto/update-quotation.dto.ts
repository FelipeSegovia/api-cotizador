import { CreateQuotationDto } from './create-quotation.dto';

/**
 * El front envía el cuerpo completo en `PUT /api/quotations/:id`,
 * por lo que reutilizamos el shape de creación (reemplazo total).
 */
export class UpdateQuotationDto extends CreateQuotationDto {}
