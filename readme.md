### IDCS Audit Events to Object Store

This little utility is designed to be called periodically in order to archive the IDCS Audit Events. It is written as a serverless function using the [fn framework](https://fnproject.io/) to run in [OCI](https://cloud.oracle.com/). 

Uses:

* Public/Private Key authentication with IDCS
* Secrets in Vault to store the key for the above
* Resource principal Authentication for OCI API invocations (Secrets, Obj Store)

Required configuration:

* Client in IDCS (with Audit Admin, and public key associated with it for Client Credentials)
* Private key for the above stored in Secrets
* (empty) Object Storage bucket created
* Dynamic Group which includes the running function
* Policies on the Dyanmic Group for read access to the Secret, list objects in bucket, and create object in bucket
* Some sort of scheduler (I used health checks and API Gateway)

For a more detailed write up, see the accompanying post on [Red Thunder](https://redthunder.blog/2020/10/02/simple-secure-log-retention-using-oci-services/)

Navigating this repo:

Structure is a little monolithic... Main implementation is in funcImpl (which allows for unit-testing, as opposed to doing the implementation in func.js, which would load the FDK wrapper). Reusable OCI capabilities are in /util, which provides request signing, a config loader, token management, etc. For some reason I put the secrets behaviour in its own module, but not the object store capability - eh, future refactoring.

Perpetual TODO: Better test coverage...
