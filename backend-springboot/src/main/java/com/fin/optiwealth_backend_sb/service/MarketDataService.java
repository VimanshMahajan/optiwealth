package com.fin.optiwealth_backend_sb.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

@Service
public class MarketDataService {

    @Value("${alphavantage.api.key}")
    private String apiKey;

    @Value("${alphavantage.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> getLivePrice(String symbol) {
        String url = UriComponentsBuilder.fromHttpUrl(apiUrl)
                .queryParam("function", "GLOBAL_QUOTE")
                .queryParam("symbol", symbol)
                .queryParam("apikey", apiKey)
                .toUriString();

        String response = restTemplate.getForObject(url, String.class);
        JSONObject json = new JSONObject(response);

        JSONObject quote = json.optJSONObject("Global Quote");
        if (quote == null) {
            throw new RuntimeException("Invalid symbol or API limit reached");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("symbol", symbol);
        data.put("price", Double.parseDouble(quote.getString("05. price")));
        data.put("previousClose", Double.parseDouble(quote.getString("08. previous close")));
        data.put("changePercent", quote.getString("10. change percent"));

        return data;
    }
}
