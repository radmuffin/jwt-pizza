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

	// await page.goto("http://localhost:5173/");
	await page.goto("/");

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

	// await page.goto("http://localhost:5173/");
	await page.goto("/");

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
	// part of this test is pretty redundant, also did a wrong password
	await page.route("*/**/version.json", async (route) => {
		const versionRes = { version: "1.0.0" };
		await route.fulfill({ json: versionRes });
	});

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
			{
				id: 3,
				title: "Margarita",
				image: "pizza3.png",
				price: 0.0042,
				description: "Essential classic",
			},
			{
				id: 4,
				title: "Crusty",
				image: "pizza4.png",
				price: 0.0028,
				description: "A dry mouthed favorite",
			},
		];
		expect(route.request().method()).toBe("GET");
		await route.fulfill({ json: menuRes });
	});

	await page.route("*/**/api/franchise", async (route) => {
		const franchiseRes = [
			{
				id: 1,
				name: "pizzaPocket",
				stores: [
					{
						id: 1,
						name: "SLC",
					},
				],
			},
		];
		expect(route.request().method()).toBe("GET");
		await route.fulfill({ json: franchiseRes });
	});

	await page.route("*/**/api/auth", async (route) => {
		expect(route.request().method()).toBe("PUT");
		const loginReq = { email: "d@jwt.com", password: "diner" };
		const loginRes = {
			user: {
				id: 2,
				name: "pizza diner",
				email: "d@jwt.com",
				roles: [
					{
						role: "diner",
					},
				],
			},
			token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6InBpenphIGRpbmVyIiwiZW1haWwiOiJkQGp3dC5jb20iLCJyb2xlcyI6W3sicm9sZSI6ImRpbmVyIn1dLCJpYXQiOjE3MzkzMDQwMTB9.m4hPKgKCJiQC60mI81XsEQ5EwTSTHjUgJBR702Kqnzw",
		};
		if (route.request().postDataJSON().password !== "diner") {
			const failRes = {
				message: "unknown user",
			};
			await route.fulfill({ status: 404, json: failRes });
		} else {
			expect(route.request().postDataJSON()).toMatchObject(loginReq);
			await route.fulfill({ json: loginRes });
		}
	});

	await page.route("*/**/api/order", async (route) => {
		if (route.request().method() === "POST") {
			const orderReq = {
				items: [
					{
						menuId: 4,
						description: "Crusty",
						price: 0.0028,
					},
				],
				storeId: "1",
				franchiseId: 1,
			};
			const orderRes = {
				order: {
					items: [
						{
							menuId: 4,
							description: "Crusty",
							price: 0.0028,
						},
					],
					storeId: "1",
					franchiseId: 1,
					id: 9,
				},
				jwt: "eyJpYXQiOjE3MzkzMDQwMTIsImV4cCI6MTczOTM5MDQxMiwiaXNzIjoiY3MzMjkuY2xpY2siLCJhbGciOiJSUzI1NiIsImtpZCI6IjE0bk5YT21jaWt6emlWZWNIcWE1UmMzOENPM1BVSmJuT2MzazJJdEtDZlEifQ.eyJ2ZW5kb3IiOnsiaWQiOiJkYmFzMiIsIm5hbWUiOiJEYW5pZWwgU3BpZXNtYW4ifSwiZGluZXIiOnsiaWQiOjIsIm5hbWUiOiJwaXp6YSBkaW5lciIsImVtYWlsIjoiZEBqd3QuY29tIn0sIm9yZGVyIjp7Iml0ZW1zIjpbeyJtZW51SWQiOjQsImRlc2NyaXB0aW9uIjoiQ3J1c3R5IiwicHJpY2UiOjAuMDAyOH1dLCJzdG9yZUlkIjoiMSIsImZyYW5jaGlzZUlkIjoxLCJpZCI6OX19.A02IOgVX-qpL61EZrABbgsyKeUEAfQDyF8kYkF6sHUIr9N0FICjZhGT-G0vYdW0Vsi-4fDsMIjuNbyJ20aWKwlWHNWdzVCVjNAtF_8cUtQINv2K7JjtN0uRLCTp_80ilXbma7_SyrNi4icSJld5iWi5NOSADgFRFZhU_VEhIkIVbNUOvCPoPQUWmhQWLYG_5Y_q2aiNbHhnc3g4tCmL8KvB757wamURrUGaeeX_UQRteqVtRHa2rHpK0NVwCeD6F-rk_DVa0nCbE0rUS426Vs7wFprF587zitJ8DFmrKFrGbAXHMrmKaNdlZCavZATpZO2n9FqLd5JA_Kfk0sMYAE4pjNY5u8WhhYtPwmn00V8ZkWVIfUS2lUXx3PxbdOgjmUrIXhBppGk4sA9laIZfRwyrk-wJ5J7Ns7OBzwefB29Tbo_OqAO1r7l_QRt9wmgaXh_zi74uZR25x1Xe9QrvdhLIUgJZQApPqnGUpPZioVvNIrruFb7fDsV_nwkgxhcHX87s2XGRVTn6Zk5PIZuFln5KhQzAPi3DT8QUFvbSYdhqmUU31AM0GF7nacfUAZWu-lSXP-lD-PX5yR_mjJDjlg_UjrsizrmY6bhY3g2TqftiCv1V_OU0xz7z1CiMzX1I_dU9n0UzeOjjlEYPE35_u6j-iglW4hkqNlFvolFu3Nw0",
			};
			expect(route.request().postDataJSON()).toMatchObject(orderReq);
			await route.fulfill({ json: orderRes });
		} else if (route.request().method() === "GET") {
			const orderRes = {
				dinerId: 2,
				orders: [
					{
						id: 1,
						franchiseId: 1,
						storeId: 1,
						date: "2025-02-11T06:03:53.000Z",
						items: [
							{
								id: 1,
								menuId: 1,
								description: "Veggie",
								price: 0.0038,
							},
							{
								id: 2,
								menuId: 2,
								description: "Pepperoni",
								price: 0.0042,
							},
						],
					},
				],
				page: 1,
			};
			await route.fulfill({ json: orderRes });
		}
	});

	// there's another fetch to the factory but we should be chill leaving that one

	// await page.goto("http://localhost:5173/");
	await page.goto("/");

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

test("admin stuff", async ({ page }) => {
	await page.route("*/**/version.json", async (route) => {
		const versionRes = { version: "1.0.0" };
		await route.fulfill({ json: versionRes });
	});
	// await page.route("*/**/api/auth", async (route) => {
	// 	const loginReq = { email: "a@jwt.com", password: "a" };
	// 	const loginRes = {
	// 		user: {
	// 			id: 3,
	// 			name: "Kai Chen",
	// 			email: "a@jwt.com",
	// 			roles: [{ role: "admin" }],
	// 		},
	// 		token: "abcdef",
	// 	};
	// 	expect(route.request().method()).toBe("PUT");
	// 	expect(route.request().postDataJSON()).toMatchObject(loginReq);
	// 	await route.fulfill({ json: loginRes });
	// });



});

// test("franchise stuff", async ({ page }) => {
// 	await page.route("*/**/version.json", async (route) => {
// 		const versionRes = { version: "1.0.0" };
// 		await route.fulfill({ json: versionRes });
// 	});
	

// 	await page.goto("http://localhost:5173/");
// 	await page.getByRole("link", { name: "Login" }).click();
// 	await expect(page.getByRole("heading")).toContainText("Welcome back");
// 	await page.getByRole("textbox", { name: "Email address" }).click();
// 	await page.getByRole("textbox", { name: "Email address" }).fill("f@jwt.com");
// 	await page.getByRole("textbox", { name: "Email address" }).press("Tab");
// 	await page.getByRole("textbox", { name: "Password" }).fill("a");
// 	await page.getByRole("button", { name: "Login" }).click();
// 	await expect(page.getByLabel("Global")).toContainText("JWT Pizza");
// 	await page
// 		.getByLabel("Global")
// 		.getByRole("link", { name: "Franchise" })
// 		.click();
// 	await expect(page.getByRole("main")).toContainText(
// 		"Everything you need to run an JWT Pizza franchise. Your gateway to success."
// 	);
// 	await page.getByRole("button", { name: "Create store" }).click();
// 	await expect(page.getByRole("heading")).toContainText("Create store");
// 	await page.getByRole("textbox", { name: "store name" }).click();
// 	await page.getByRole("textbox", { name: "store name" }).fill("rg");
// 	await page.getByRole("button", { name: "Create" }).click();
// 	await expect(page.locator("tbody")).toContainText("rg");
// 	await page.getByRole("button", { name: "Close" }).click();
// 	await expect(page.getByRole("heading")).toContainText("Sorry to see you go");
// 	await page.getByRole("button", { name: "Close" }).click();
// 	await page.getByRole("button", { name: "Close" }).click();
// });
