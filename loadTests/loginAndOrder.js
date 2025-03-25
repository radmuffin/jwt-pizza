import { sleep, check, fail } from 'k6'
import http from 'k6/http'
import jsonpath from 'https://jslib.k6.io/jsonpath/1.0.2/index.js'

export const options = {
    cloud: {
        distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
        apm: [],
    },
    thresholds: {},
    scenarios: {
        Scenario_1: {
            executor: 'ramping-vus',
            gracefulStop: '30s',
            stages: [
                { target: 20, duration: '1m' },
                { target: 40, duration: '1m' },
                { target: 0, duration: '30s' },
            ],
            gracefulRampDown: '30s',
            exec: 'scenario_1',
        },
    },
}

export function scenario_1() {
    let response

    const vars = {}

    response = http.put(
        'https://pizza-service.radmuffin.click/api/auth',
        '{"email":"d@jwt.com","password":"diner"}',
        {
            headers: {
                accept: '*/*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/json',
                origin: 'https://pizza.radmuffin.click',
                priority: 'u=1, i',
                'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
            },
        }
    )
    if (!check(response, { 'status equals 200': response => response.status.toString() === '200' })) {
        console.log(response.body);
        fail('Login was *not* 200');
    }


    vars['token'] = jsonpath.query(response.json(), '$.token')[0]

    sleep(6)

    response = http.get('https://pizza-service.radmuffin.click/api/order/menu', {
        headers: {
            accept: '*/*',
            'accept-encoding': 'gzip, deflate, br, zstd',
            'accept-language': 'en-US,en;q=0.9',
            authorization: `Bearer ${vars['token']}`,
            'content-type': 'application/json',
            origin: 'https://pizza.radmuffin.click',
            priority: 'u=1, i',
            'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
        },
    })
    sleep(10)

    response = http.get('https://pizza-service.radmuffin.click/api/franchise', {
        headers: {
            accept: '*/*',
            'accept-encoding': 'gzip, deflate, br, zstd',
            'accept-language': 'en-US,en;q=0.9',
            authorization: `Bearer ${vars['token']}`,
            'content-type': 'application/json',
            origin: 'https://pizza.radmuffin.click',
            priority: 'u=1, i',
            'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
        },
    })
    sleep(16.3)

    response = http.post(
        'https://pizza-service.radmuffin.click/api/order',
        '{"items":[{"menuId":4,"description":"Crusty","price":0.0028}],"storeId":"1","franchiseId":1}',
        {
            headers: {
                accept: '*/*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en;q=0.9',
                authorization: `Bearer ${vars['token']}`,
                'content-type': 'application/json',
                origin: 'https://pizza.radmuffin.click',
                priority: 'u=1, i',
                'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
            },
        }
    )

    vars.jwt = response.json().jwt

    sleep(2.4)

    response = http.post(
        'https://pizza-factory.cs329.click/api/order/verify',
        `{"jwt":${vars.jwt}}`,
        {
            headers: {
                accept: '*/*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en;q=0.9',
                authorization: `Bearer ${vars['token']}`,
                'content-type': 'application/json',
                origin: 'https://pizza.radmuffin.click',
                priority: 'u=1, i',
                'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'sec-fetch-storage-access': 'active',
            },
        }
    )
}
