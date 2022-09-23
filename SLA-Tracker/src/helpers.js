import api, { route } from "@forge/api";

export const getDataFromJira = async url => {
    try {
        const response = await api.asUser().requestJira(route`${url}`);
        const result = await response.json();
        return result;
    } catch (error) {
        console.log("getDataFromJira error: ", error);
        throw error;
    }
};

export const sendEmailToAssignee = async (issueKey, notifyBody) => {
    const body = {
        htmlBody: notifyBody,
        subject: "SLA-Tracker Notification",
        to: {
            voters: false,
            watchers: false,
            groups: [
                {
                    name: "jira-software-users"
                }
            ],
            reporter: false,
            assignee: true,
            users: []
        },
        restrict: {
            permissions: [],
            groups: []
        }
    };
    const response = await api
        .asUser()
        .requestJira(route`/rest/api/3/issue/${issueKey}/notify`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
};


export const getIssueChangelog = async (issueKey) => {
    const response = await getDataFromJira(route`/rest/api/3/issue/${issueKey}/changelog`);
    return issueChangelogTransformer(response);
};



export const getProjects = async () => {
    const response = await getDataFromJira(route`/rest/api/3/project/search`);
    return projectsTransformer(response);
}

