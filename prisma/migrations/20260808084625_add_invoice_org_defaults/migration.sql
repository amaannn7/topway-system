-- AlterTable
ALTER TABLE "org_settings" ADD COLUMN     "defaultAccountName" TEXT NOT NULL DEFAULT 'M.Z.M AZZAM',
ADD COLUMN     "defaultAccountNo" TEXT NOT NULL DEFAULT '8110040878',
ADD COLUMN     "defaultBankName" TEXT NOT NULL DEFAULT 'COMMERCIAL BANK – COLOMBO -03',
ADD COLUMN     "defaultSwiftCode" TEXT NOT NULL DEFAULT 'CCEYKLXXXX',
ADD COLUMN     "invoiceFooterAddress" TEXT NOT NULL DEFAULT 'No.95 1/1, S. Mahinda Himi Mawatha, Maradana, Colombo 10',
ADD COLUMN     "invoiceFooterEmail" TEXT NOT NULL DEFAULT 'info@topway.lk',
ADD COLUMN     "invoiceFooterFax" TEXT NOT NULL DEFAULT '+94 115 931 272',
ADD COLUMN     "invoiceFooterPhone" TEXT NOT NULL DEFAULT '+94 115 991 089',
ADD COLUMN     "invoiceFooterWebsite" TEXT NOT NULL DEFAULT 'www.topway.lk';
