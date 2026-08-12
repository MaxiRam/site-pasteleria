PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_insumos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`cantidad_comprada` real NOT NULL,
	`unidad` text NOT NULL,
	`precio_compra` real NOT NULL,
	`precio_unitario_base` real NOT NULL,
	`tipo` text DEFAULT 'ingrediente' NOT NULL,
	CONSTRAINT "insumos_unidad_check" CHECK("__new_insumos"."unidad" in ('ml','g','kg','unidad')),
	CONSTRAINT "insumos_tipo_check" CHECK("__new_insumos"."tipo" in ('ingrediente','packaging')),
	CONSTRAINT "insumos_packaging_unidad_check" CHECK("__new_insumos"."tipo" != 'packaging' or "__new_insumos"."unidad" = 'unidad')
);
--> statement-breakpoint
INSERT INTO `__new_insumos`("id", "nombre", "cantidad_comprada", "unidad", "precio_compra", "precio_unitario_base", "tipo") SELECT "id", "nombre", "cantidad_comprada", "unidad", "precio_compra", "precio_unitario_base", "tipo" FROM `insumos`;--> statement-breakpoint
DROP TABLE `insumos`;--> statement-breakpoint
ALTER TABLE `__new_insumos` RENAME TO `insumos`;--> statement-breakpoint
PRAGMA foreign_keys=ON;