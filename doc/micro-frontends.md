# Micro Frontends

## Features

- **Micro Frontends (MFE) Integration:** Designed as a self-contained unit, ready for integration
  into a larger MFE ecosystem, enhancing modularity and flexibility.
- **Webpack 5 & Module Federation:** Utilizes advanced bundling and module federation techniques to
  expose single or multiple components through a `remoteEntry` file, facilitating efficient
  component sharing and collaboration across MFEs.
- **Component Exposition and Sharing:** Exposes components for use by other MFEs, allowing for
  reusability and consistency across the larger application.
- **Scalable and Modular Architecture:** Designed for scalability, it supports the growing needs of
  large-scale applications by allowing easy integration of additional MFEs.

## Example: Configuring Webpack with Module Federation to Expose a Component

Here is an example of how to configure Webpack with Module Federation to expose a component:

```javascript
// webpack.config.ts
const ModuleFederationPlugin = require("webpack").container.ModuleFederationPlugin;

module.exports = {
  ...
  plugins: [
    new ModuleFederationPlugin({
      name: "MyMicroFrontend",
      filename: "remoteEntry.js",
      exposes: {
        './MyComponent': './src/MyComponent',
      },
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true }
      },
    }),
  ],
  ...
};
```

In this configuration:

- `name`: The name of your MFE. This will be used by the host application to reference your MFE.
- `filename`: The name of the file that acts as the entry point for the host to load your MFE.
- `exposes`: An object mapping paths (as seen by the host) to the corresponding file paths in your
  source code. Here, `./MyComponent` is exposed for the host to import.
- `shared`: Lists packages that should be shared between the host and the MFE, like React and
  ReactDOM. The `singleton: true` ensures that only a single version of these shared modules is
  used.

This setup allows your MFE to expose `MyComponent`, which can be dynamically loaded by a host
application.

## Building and Contributing MFEs

- Each MFE should be built using Webpack 5 and Module Federation.
- MFEs must expose the components to be used at runtime by the container app.

## Best Practices

- Ensure MFEs are loosely coupled and can operate independently.
- Maintain consistency in design and user experience across different MFEs.
- Regularly update dependencies to leverage the latest features of Webpack and React.

## Communication between MFEs

Micro Frontends (MFEs) are a design approach in which a web application is composed of
semi-independent "micro" applications, each potentially owned by different teams and built with
their preferred frameworks or technologies. Communication between these MFEs is crucial for
maintaining a cohesive user experience and ensuring that each component can effectively share data
and state changes.

### Using `useMFECommunication` Hook for MFE Communication

The `useMFECommunication` React hook facilitates communication between MFEs, especially when they
are served from different domains or origins, where traditional methods like the Broadcast Channel
API are not feasible. This hook leverages the `window` object's ability to dispatch and listen for
custom events, thus enabling cross-origin communication in a secure and controlled manner.

#### How to Implement:

1. **Define the Hook:**

- Import `useMFECommunication` in your MFE's components where you need to send or receive data.

2. **Sending Data:**

- Use the `sendEvent` function provided by the hook to dispatch a custom event with the desired
  data payload.

   ```typescript
   const sendEvent = useCustomWindowEvent<MyCustomEventData>('myEventName');
   sendEvent({message: 'Hello from MFE1'});
   ```

3. **Receiving Data:**

- Register a callback function to handle incoming data when a specific event is received.

   ```typescript
   useCustomWindowEvent<MyCustomEventData>('myEventName', (data) => {
      console.log('Received data:', data.message);
     // Additional logic to handle the received data
   });
   ```
