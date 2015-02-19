# Gatewayd Basic App

[http://gatewayd.org/tools/basic](http://gatewayd.org/tools/basic)

The gatewayd basic admin webapp allows administrators to log in to their gateway remotely and utilize gatewayd's endpoints involving ripple address (**/v1/ripple_address**), ripple transactions (**/v1/ripple_transactions**), sending ripple payments (**POST /v1/payments/outgoing**).

Features:
- Monitor incoming/outgoing ripple transactions in real time
- Check transaction details
- Clear incoming transactions before they're processed
- Send payments (issue currency) to a ripple address or ripple name

### Table of Contents
- **[How To Set Up](#how-to-set-up)**
- **[How To Use](#how-to-use)**
- **[Developers](#developers)**
- **[Dependencies For Compatibility With Quoting App](#dependencies-for-compatibility-with-quoting-app)**
- **[How To Set Up For Compatibility With Quoting App](#how-to-set-up-for-compatibility-with-quoting-app)**

## How To Set Up

1. [Start up your gateway](https://ripple.com/build/gatewayd/#gatewayd-usage).

2. To get your API key, in the terminal:

    ```
    $ bin/gateway get_key
    ```

3. Visit the gateway's host url in the browser to trust and accept the security authorization.

    ```
    "Advanced" => "Proceed anyway"
    ```

4. Visit the [gatewayd basic admin webapp](http://gatewayd.org/tools/basic).

5. Enter your gatewayd host url, username (*admin@example.com* by default*), and API key to log in.

_* If admin@example.com does not work as the username, check_ **/config/config.json** _or_ **/config/environment.js** _in gatewayd and append admin@ with the value of the DOMAIN property._

## How To Use

1. Navigate the links to filter between transaction types.

2. Click on a 'Ripple Graph Link' within the payments list to see a graphical representation of the transaction.

3. Click on a transaction to see its details.

4. Click the 'Send Payment' link to open a form for sending payments specifying a Ripple address or Ripple name.

5. Payments will be constantly refreshed while app's tab/window is active/open.

## Developers

1. Clone the webapp repo from [Github](https://github.com/gatewayd/gatewayd-basic-app):

    ```
    $ git clone git@github.com:gatewayd/gatewayd-basic-app.git
    ```

2. Navigate to the cloned directory and install its dependencies:

    ```
    $ npm install
    $ bower install
    ```

3. Run the gulp build process/live reload server:

    ```
    npm run dev
    ```

or for compressed production builds without live reload or watch:

    ```
    npm run prod
    ```

    If you get an EMFILE error, you need to increase the maximum number of files than can be opened and processes that can be used:

    ```
    $ ulimit -n 1000
    $ ulimit -u 1000
    ```

4. In your browser, access the local webapp via the default url:

    ```
    http://localhost:8080
    ```

5. If you are using Chrome, install [Live Reload](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei) and click the Live Reload icon to activate live reloading when your files are modified and rebuilt.

6. This application uses [React](http://facebook.github.io/react/docs/tutorial.html) views and [Backbone stores](http://www.toptal.com/front-end/simple-data-flow-in-react-applications-using-flux-and-backbone?utm_source=javascriptweekly&utm_medium=email) within the [Flux architecture](http://facebook.github.io/flux/docs/overview.html). [React Router](https://github.com/rackt/react-router) is used for client-side routing. It also has Bootstrap styling supported with [React Bootstrap](http://react-bootstrap.github.io/).

7. There is an app config file at **/app/scripts/shared/app-config.js** that allows you to set up the default host url and username if you want to expedite the login process.

8. You can find the root of the of app at:

    ```
    /app/scripts/main.jsx
    ```

## Dependencies For Compatibility With Quoting App

[Gatewayd - develop branch](https://github.com/ripple/gatewayd/tree/develop)

```
$ git checkout develop
$ git pull
$ npm install
```

[Quoting App - task/demo branch](https://github.com/gatewayd/gatewayd-quoting-app/tree/task/demo)

```
$ git checkout task/demo
$ git reset --hard origin/task/demo
```

[Banking App - task/demo branch](https://github.com/gatewayd/gatewayd-banking-app/tree/task/demo)

```
$ git checkout task/demo
$ git reset --hard origin/task/demo
```

[Basic App - task/demo branch](https://github.com/gatewayd/gatewayd-basic-app/tree/task/demo)

```
$ git checkout task/demo
$ git reset --hard origin/task/demo
```

## How To Set Up For Compatibility With Quoting App

The quoting app requires the gateway's user auth and basic auth to be disabled to allow gateways to freely communicate with each other. To configure everything to allow the basic app to work with the quoting app in tandem:

1. [Set up your gateway(s)](https://ripple.com/build/gatewayd/#gatewayd-usage) and make sure the branch is correct as per the [app dependencies](#dependencies-for-compatibility-with-quoting-app).

2. Edit each gateway's config file:

    ```
    $ vim config/config.json
    ```
    Make sure these attributes are set as follows:

        {
            ...
            "SSL": true,
            "USER_AUTH": false,
            "BASIC_AUTH": false,
            "PORT": 5000,
            "DOMAIN": "localhost:5000",
            ...
        }

    PORT and DOMAIN can be changed accordingly (e.g. changing PORT to 5050 and DOMAIN to localhost:5050 on a second gateway).

3. Visit each gateway's host url in the browser to trust and accept the security authorization.

    ```
    "Advanced" => "Proceed anyway"
    ```

4. Clone the app repo from [Github](https://github.com/gatewayd/gatewayd-basic-app):

    ```
    $ git clone git@github.com:gatewayd/gatewayd-basic-app.git
    ```

5. Navigate to the cloned directory, make sure the branch is correct as per the [app dependencies](#dependencies-for-compatibility-with-quoting-app),  and install its dependencies:

    ```
    $ npm install
    $ bower install
    ```

6. Edit the basic app's **secrets.json** file to configure from which gatewayd instance you want to monitor (*url*).

    ```
    $ vim secrets.json
    ```

    {
        "key": "",
        "url": "https://localhost:5000"
    }

7. Run the gulp build process/live reload server:

    ```
    npm run dev
    ```
    If you get an EMFILE error, you need to increase the maximum number of files than can be opened and processes that can be used:

    ```
    $ ulimit -n 2048
    $ ulimit -u 2048
    ```

8. In your browser, access the local webapp via the default url or the port at localhost specified from step 6:

    ```
    http://localhost:8080
    ```
