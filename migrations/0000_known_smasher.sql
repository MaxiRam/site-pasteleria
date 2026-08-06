CREATE TABLE `admins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_unique` ON `admins` (`email`);--> statement-breakpoint
CREATE TABLE `insumos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`cantidad_comprada` real NOT NULL,
	`unidad` text NOT NULL,
	`precio_compra` real NOT NULL,
	`precio_unitario_base` real NOT NULL,
	CONSTRAINT "insumos_unidad_check" CHECK("insumos"."unidad" in ('ml','g','kg','unidad'))
);
--> statement-breakpoint
CREATE TABLE `precios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`producto_id` integer NOT NULL,
	`diametro` integer NOT NULL,
	`costo_calculado` real NOT NULL,
	`margen_pct` real NOT NULL,
	`precio_sugerido` real NOT NULL,
	`precio_venta` real,
	`confirmado` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "precios_diametro_check" CHECK("precios"."diametro" in (12,18,20,22,25))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `precios_producto_diametro_unique` ON `precios` (`producto_id`,`diametro`);--> statement-breakpoint
CREATE TABLE `productos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`receta_id` integer NOT NULL,
	`nombre_publico` text NOT NULL,
	`descripcion` text,
	`imagen` text,
	`publicado` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`receta_id`) REFERENCES `recetas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `receta_insumos` (
	`receta_id` integer NOT NULL,
	`insumo_id` integer NOT NULL,
	`cantidad` real NOT NULL,
	PRIMARY KEY(`receta_id`, `insumo_id`),
	FOREIGN KEY (`receta_id`) REFERENCES `recetas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recetas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`diametro_base` integer NOT NULL,
	CONSTRAINT "recetas_diametro_base_check" CHECK("recetas"."diametro_base" in (12,18,20,22,25))
);
