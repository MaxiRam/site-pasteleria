PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_producto_insumos` (
	`producto_id` integer NOT NULL,
	`insumo_id` integer NOT NULL,
	`diametro` integer NOT NULL,
	`cantidad` real NOT NULL,
	PRIMARY KEY(`producto_id`, `insumo_id`, `diametro`),
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "producto_insumos_diametro_check" CHECK("__new_producto_insumos"."diametro" in (12,18,20,22,25))
);
--> statement-breakpoint
-- Nota: no hay INSERT...SELECT desde la tabla vieja. `producto_insumos`
-- recién se introdujo (packaging sin diámetro) en una migración anterior
-- de este mismo PR, sin release de por medio; sus filas no tienen ningún
-- `diametro` real que backfillear (el codegen de drizzle-kit generó un
-- SELECT "diametro" inválido acá, porque la tabla vieja no tiene esa
-- columna). Como no hay datos de producción que preservar, la tabla queda
-- vacía después del rebuild.
DROP TABLE `producto_insumos`;--> statement-breakpoint
ALTER TABLE `__new_producto_insumos` RENAME TO `producto_insumos`;--> statement-breakpoint
PRAGMA foreign_keys=ON;