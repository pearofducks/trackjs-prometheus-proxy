# TrackJS to Prometheus proxy

a webapp to download error-rates from TrackJS and serve them as Prometheus metrics

## setup

You'll need to provide your `CUSTOMER_ID` and `AUTHORIZATION` either as environment variables, or in a `.env` file.

Example .env file:

```
CUSTOMER_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AUTHORIZATION=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

then add any applications you want to proxy to the array in `applications.js`.

## dev

You can start a development environment with `npm run dev`.

## prod

You can start an instance without and debug logging with `npm start`.
