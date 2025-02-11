import { version } from "os";
import { test, expect } from "playwright-test-coverage";

test("home page", async ({ page }) => {
	await page.goto("/");

	expect(await page.title()).toBe("JWT Pizza");
});

test("purchase with login", async ({ page }) => {
	await page.route("*/**/api/order/menu", async (route) => {
		const menuRes = [
			{
				id: 1,
				title: "Veggie",
				image: "pizza1.png",
				price: 0.0038,
				description: "A garden of delight",
			},
			{
				id: 2,
				title: "Pepperoni",
				image: "pizza2.png",
				price: 0.0042,
				description: "Spicy treat",
			},
		];
		expect(route.request().method()).toBe("GET");
		await route.fulfill({ json: menuRes });
	});

	await page.route("*/**/api/franchise", async (route) => {
		const franchiseRes = [
			{
				id: 2,
				name: "LotaPizza",
				stores: [
					{ id: 4, name: "Lehi" },
					{ id: 5, name: "Springville" },
					{ id: 6, name: "American Fork" },
				],
			},
			{
				id: 3,
				name: "PizzaCorp",
				stores: [{ id: 7, name: "Spanish Fork" }],
			},
			{ id: 4, name: "topSpot", stores: [] },
		];
		expect(route.request().method()).toBe("GET");
		await route.fulfill({ json: franchiseRes });
	});

	await page.route("*/**/api/auth", async (route) => {
		const loginReq = { email: "d@jwt.com", password: "a" };
		const loginRes = {
			user: {
				id: 3,
				name: "Kai Chen",
				email: "d@jwt.com",
				roles: [{ role: "diner" }],
			},
			token: "abcdef",
		};
		expect(route.request().method()).toBe("PUT");
		expect(route.request().postDataJSON()).toMatchObject(loginReq);
		await route.fulfill({ json: loginRes });
	});

	await page.route("*/**/api/order", async (route) => {
		const orderReq = {
			items: [
				{ menuId: 1, description: "Veggie", price: 0.0038 },
				{ menuId: 2, description: "Pepperoni", price: 0.0042 },
			],
			storeId: "4",
			franchiseId: 2,
		};
		const orderRes = {
			order: {
				items: [
					{ menuId: 1, description: "Veggie", price: 0.0038 },
					{ menuId: 2, description: "Pepperoni", price: 0.0042 },
				],
				storeId: "4",
				franchiseId: 2,
				id: 23,
			},
			jwt: "eyJpYXQ",
		};
		expect(route.request().method()).toBe("POST");
		expect(route.request().postDataJSON()).toMatchObject(orderReq);
		await route.fulfill({ json: orderRes });
	});

	await page.goto("/");

	// Go to order page
	await page.getByRole("button", { name: "Order now" }).click();

	// Create order
	await expect(page.locator("h2")).toContainText("Awesome is a click away");
	await page.getByRole("combobox").selectOption("4");
	await page.getByRole("link", { name: "Image Description Veggie A" }).click();
	await page
		.getByRole("link", { name: "Image Description Pepperoni" })
		.click();
	await expect(page.locator("form")).toContainText("Selected pizzas: 2");
	await page.getByRole("button", { name: "Checkout" }).click();

	// Login
	await page.getByPlaceholder("Email address").click();
	await page.getByPlaceholder("Email address").fill("d@jwt.com");
	await page.getByPlaceholder("Email address").press("Tab");
	await page.getByPlaceholder("Password").fill("a");
	await page.getByRole("button", { name: "Login" }).click();

	// Pay
	await expect(page.getByRole("main")).toContainText(
		"Send me those 2 pizzas right now!"
	);
	await expect(page.locator("tbody")).toContainText("Veggie");
	await expect(page.locator("tbody")).toContainText("Pepperoni");
	await expect(page.locator("tfoot")).toContainText("0.008 ₿");
	await page.getByRole("button", { name: "Pay now" }).click();

	// Check balance
	await expect(page.getByText("0.008")).toBeVisible();
});

test("register and logout", async ({ page }) => {
	await page.route("*/**/api/auth", async (route) => {
		const request = route.request();
		if (request.method() === "POST") {
			const registerReq = {
				name: "broddy",
				email: "br@jwt.com",
				password: "password",
			};
			const registerRes = {
				user: {
					name: "broddy",
					email: "br@jwt.com",
					roles: [
						{
							role: "diner",
						},
					],
					id: 8,
				},
				token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYnJvZGR5IiwiZW1haWwiOiJickBqd3QuY29tIiwicm9sZXMiOlt7InJvbGUiOiJkaW5lciJ9XSwiaWQiOjgsImlhdCI6MTczOTI5MzE2OH0.pe10p7p_f6AOktZZmg0n6l7OvHFgeXhGCpVofauchbM",
			};
			expect(request.postDataJSON()).toMatchObject(registerReq);
			await route.fulfill({ json: registerRes });
		} else if (request.method() === "DELETE") {
			const authRes = {
				message: "logout successful",
			};
			await route.fulfill({ json: authRes });
		}
	});

	await page.route("*/**/version.json", async (route) => {
		const versionRes = { version: "1.0.0" };
		await route.fulfill({ json: versionRes });
	});

	await page.goto("http://localhost:5173/");
	await page.getByRole("link", { name: "Register" }).click();
	await expect(page.getByRole("heading")).toContainText(
		"Welcome to the party"
	);
	await page.getByRole("textbox", { name: "Full name" }).click();
	await page.getByRole("textbox", { name: "Full name" }).fill("broddy");
	await page.getByRole("textbox", { name: "Full name" }).press("Tab");
	await page
		.getByRole("textbox", { name: "Email address" })
		.fill("br@jwt.com");
	await page.getByRole("textbox", { name: "Email address" }).press("Tab");
	await page.getByRole("textbox", { name: "Password" }).fill("password");
	await page.getByRole("button", { name: "Register" }).click();
	await page.getByRole("link", { name: "Logout" }).click();
	await page
		.getByLabel("Global")
		.getByRole("link", { name: "Franchise" })
		.click();
	await expect(page.getByRole("alert")).toContainText(
		"If you are already a franchisee, pleaseloginusing your franchise account"
	);
	await expect(page.getByRole("main")).toContainText("800-555-5555");
});

test("visit about and history", async ({ page }) => {
	await page.route("*/**/version.json", async (route) => {
		const versionRes = { version: "1.0.0" };
		await route.fulfill({ json: versionRes });
	});

	await page.goto("http://localhost:5173/");
	await page.getByRole("link", { name: "About" }).click();
	await expect(page.getByRole("main")).toContainText("The secret sauce");
	await expect(
		page
			.locator("div")
			.filter({ hasText: /^Brian$/ })
			.getByRole("img")
	).toBeVisible();
	await page.getByRole("link", { name: "History" }).click();
	await expect(page.getByRole("heading")).toContainText("Mama Rucci, my my");
	await expect(page.getByRole("main").getByRole("img")).toBeVisible();
});

test("verify jwt", async ({ page }) => {
	await page.goto("http://localhost:5173/");
	await page.getByRole("link", { name: "Order" }).click();
	await page.getByRole("combobox").selectOption("1");
	await page.getByRole("link", { name: "Image Description Crusty A" }).click();
	await page.getByRole("button", { name: "Checkout" }).click();
	await page.getByRole("textbox", { name: "Email address" }).click();
	await page.getByRole("textbox", { name: "Email address" }).fill("d@jwt.com");
	await page.getByRole("textbox", { name: "Email address" }).press("Tab");
	await page.getByRole("textbox", { name: "Password" }).fill("a");
	await page.getByRole("textbox", { name: "Password" }).press("Enter");
	await page.getByRole("button", { name: "Login" }).click();
	await expect(page.getByRole("main")).toContainText(
		'{"code":404,"message":"unknown user"}'
	);
	await page.getByRole("textbox", { name: "Password" }).click();
	await page.getByRole("textbox", { name: "Password" }).fill("diner");
	await page.getByRole("button", { name: "Login" }).click();
	await page.getByRole("button", { name: "Pay now" }).click();
	await page.getByRole("button", { name: "Verify" }).click();
	await expect(page.locator("h3")).toContainText("valid");
	await page.getByRole("button", { name: "Close" }).click();
	await page.getByRole("link", { name: "pd" }).click();
	await expect(page.getByRole("main")).toContainText("diner");
	await expect(page.getByRole("main")).toContainText("diner");
});
