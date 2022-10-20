import api, { route ,storage} from "@forge/api";
import {ESCALATION_ONE, ESCALATION_TWO, STORAGE_KEY_PREFIX} from "./constants";


export const getDataFromJira = async (url) => {
    try {
        const response = await api.asApp().requestJira(route`${url}`);
        console.log(response)
        const result = response.json();
        return result;
    } catch (error) {
        console.log("getDataFromJira error: ", error);
        throw error;
    }
};

export const getIssueChangelog = async (issueKey) => {
    const response = await getDataFromJira(route`/rest/api/3/issue/${issueKey}/changelog`);
    return issueChangelogTransformer(response);
};

const projectsTransformer = (response) => {
    if (!response) return []
    return response.values.map(({key, name}) => ({key, name}))
}

export const getProjects = async () => {
    const response = await getDataFromJira(route`/rest/api/3/project/search`);
    return projectsTransformer(response);
}

export const getIssues = async() =>{
    const response = await api.asApp().requestJira(route`/rest/api/3/search?jql=issuetype%20=%20Bug%20AND%20status%20not%20in%20(%22DONE%22)%20order%20by%20created%20DESC`, {
        headers: {
            'Accept': 'application/json'
        }
    });
    return await response.json()
}

export const getIssue = async(issueId) => {
    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueId}`, {
        headers: {
            'Accept': 'application/json'
        }
    });

    console.log(`Response: ${response.status} ${response.statusText}`);
    return await response.json()
}
export const getUser = async (accountId) => {
    console.log(`accountId in getUser: ${accountId}`)
    const response = await api.asApp().requestJira(route`/rest/api/3/user?accountId=${accountId}`, {
        headers: {
            'Accept': 'application/json'
        }
    });
    console.log(`Response from getUser: ${JSON.stringify(await response.json())}`)
    return await response.json()
}
export const updateSLA = async (issueId,slaValue) => {
    const fieldKey = "e369a089-512f-4569-a619-e5b5df46475b__DEVELOPMENT__viewSLA"
    const body = {updates:[
            {
                issueIds: [issueId],
                value: slaValue
            }
        ]};
    const response = await api.asApp().requestJira(route`/rest/api/3/app/field/${fieldKey}/value`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    console.log(`sla Update response: ${response.status}`)
}

export const getCommentsOnIssue = async (issueId) => {
    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueId}/comment`, {
        headers: {
            'Accept': 'application/json'
        }
    });
    return await response.json()
}

export const AddCommentOnIssue = async (projectKey, issueId, commentMessage) =>{
    const storageData =  await storage.get(`${STORAGE_KEY_PREFIX}_${projectKey}`);
    let user
    let contentBody
    console.log(`storage Data: ${storageData}`)
    switch(commentMessage) {
        case ESCALATION_ONE:
            user = await getUser(storageData['escalationLevel1'])
            contentBody = [
                {
                    text: commentMessage,
                    type: "text"
                },
                {
                    type: "mention",
                    attrs: {
                        id: user.accountId,
                        text: "@"+user.displayName,
                        userType: "APP"
                    }
                }
            ]
            break;
        case ESCALATION_TWO:
            user = await getUser(storageData['escalationLevel2'])
            console.log(`user.accountId: ${user.accountId}`)
            contentBody = [
                {
                    text: commentMessage,
                    type: "text"
                },
                {
                    type: "mention",
                    attrs: {
                        id: user.accountId,
                        text: "@"+user.displayName,
                        userType: "APP"
                    }
                }
            ]
            console.log(contentBody)
            break;
        default:
            contentBody = [
                {
                    text: commentMessage,
                    type: "text"
                }
            ]
    }

    const body = {body:
            {
                type: "doc",
                version: 1,
                content: [
                    {
                        type: "paragraph",
                        content: contentBody
                    }
                ]
            }
        };

    console.log(`comment Body: ${JSON.stringify(body)}`)
    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueId}/comment`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    console.log(response.status)
    return response
}

export const addComment = async (issueId,commentMessage,projectKey) => {
    console.log(`Inside Add Comment with following values: ${issueId} : ${commentMessage} : ${projectKey}` )
    const commentsList = (await getCommentsOnIssue(issueId)).comments
    console.log(`commentList of issue is: ${commentsList}`)
    let isCommentAlreadySent = false
    if(commentsList !== undefined) {
        commentsList.map(comment => {
            let tmpCommentText = comment.body.content[0].content[0].text
            if (tmpCommentText.includes(commentMessage)) {
                isCommentAlreadySent = true
                console.log("already commented")
            }
        })
    }
    if(!isCommentAlreadySent){
        console.log("Sending Comment")
        await AddCommentOnIssue(projectKey,issueId,commentMessage)
    }

}

export async function slackRequest(comment) {
    const body = {
        text: comment
    }
console.log(JSON.stringify(body))
    const response = await api.fetch(`https://hooks.slack.com/services/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`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    // if (!response.ok) {
    //     const err = `Error invoking (Slack): ${response.status} ${response.statusText}`;
    //     throw new Error(err);
    // }
    console.log(response)
    // const responseBody = await response.json();
    // return responseBody;
}

