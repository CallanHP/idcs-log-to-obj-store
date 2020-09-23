#!/bin/sh
. ./set-local-vars.sh

fn config function $FN_APP_NAME ${PWD##*/} objStoreBucketURL $OBJ_STORE_URL
fn config function $FN_APP_NAME ${PWD##*/} ociRegion $OCI_REGION
fn config function $FN_APP_NAME ${PWD##*/} idcsBaseUrl $IDCS_URL
fn config function $FN_APP_NAME ${PWD##*/} idcsCertSecretId $IDCS_SECRET_ID
fn config function $FN_APP_NAME ${PWD##*/} idcsCertAlias $IDCS_CERT_ALIAS
fn config function $FN_APP_NAME ${PWD##*/} idcsClientId $IDCS_CLIENT_ID
