# 4th & Mayor - Cloud Services

Please checkout commit ID `1d0c10ff66342ad824b8d1eef52720fabdc42eb0` to see the actual implementation.

This project is deprecated now and its dynamic cloud services have been removed.

### historical

This code represents the cloud services required to offer push notifications (a push service that communicates with foursquare), host the web site, and support REST web services for mobile clients.

Supports compute hosting models from both Windows Azure as well as Amazon Web Services.

> This technology probably isn't useful to anyone other than myself, but out of interest I have received from others, I've effectively open sourced. I suppose I'd love to accept pull requests as well!

## Web Entrypoint
`node server` boots the app into web serving mode using Express.

## Worker Entrypoint
`node worker` starts up the worker processing module.

## API Entrypoint
`node api-server` offers newer a application web server.

## E-mail Entrypoint
`node mail-server` entrypoint for parsing incoming e-mails from crashes.
