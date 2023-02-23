#!/usr/bin/env bash

if [ -z "$1" ]; then
    echo "user email needed for init session"
    exit 1
fi

set -x

PROD_PROXY=https://apigateway-internal.hoiio.com
UAT_PROXY=http://zuul-uat.hoiio.info:8080

email=$1
apiProxy=$PROD_PROXY

if [ -z "$2" ]; then
    echo "Generate for B3 Internal Testing organization"
    domain=portal.hoiio.net
    orgUuid=9b311930-2c04-4e49-9c8f-b745807dc64c # org b3 internal testing
elif [[ "$2" == "NEW_EXP" ]]; then
    echo "Generate for New B3 Experimental"
    domain=portal.hoiio.net
    orgUuid=f17b4dd0-1d78-49c7-8e31-ca4b0ad1f9b9 # org b3 internal testing
elif [[ "$2" == "NEW_QA" ]]    ; then
    echo "Generate for org QA Testing New Sale Model (v2)"
    domain=portal.hoiio.net
    orgUuid=1dbe3c47-447f-4ef5-8f9d-ba0e8ffcfaf5
elif [[ "$2" == "B3" ]]; then
    echo "Generate for B3 domain"
    domain=portal.b3networks.com
    orgUuid=fc312420-0047-49a7-94a8-003f11f115c0 #B3 org
elif [[ "$2" == "B3UAT" ]]; then
    echo "Generate for B3 UAT domain"
    domain=portal-uat.b3networks.com
    apiProxy=$UAT_PROXY
    orgUuid=8cd84d49-a5e2-49ba-993d-a8a5257ac55d #B3 org UAT
elif [[ "$2" == "HOIIOUAT" ]]; then
    echo "Generate for Hoiio NET UAT domain"
    domain=portal-uat.hoiio.net
    apiProxy=$UAT_PROXY
    orgUuid=98dc8e54-ee8f-463e-be3e-273a7cfdf7ca #B3 org UAT
else
    echo "Generate for Internal domain"
    domain=portal.hoiio.net
    if [[ $2 == "ADMIN" ]]; then
        echo "Generate for Admin organization"
        orgUuid=1a39064c-763c-4e31-ae30-4d87d901591c #Admin org
    elif [[ $2 == "QA" ]]; then
        echo "Generate for QA organization"
        orgUuid=9d336117-63e5-412e-96ca-fa5f5627b4ac #QA org
    else
        echo "Generate for organization: " $2
        orgUuid=$2
    fi
fi




uuid=$(curl -s $apiProxy/auth/internal/v1/identities\?domain\=$domain\&email\=$email | jq -r '.uuid')
sessionToken=$(curl -s -XPOST $apiProxy/auth/internal/v1/sessiontokens -d '{"identityUuid": "'$uuid'"}' -H content-type:application/json | jq -r ".sessionToken")
echo "http://localhost:4200/?sessionToken=$sessionToken&orgUuid=$orgUuid"
