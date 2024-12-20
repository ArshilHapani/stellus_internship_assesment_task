CREATE TABLE "pools" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pools_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userAddress" text NOT NULL,
	"poolAddress" text NOT NULL
);
