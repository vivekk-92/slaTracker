import api, { route ,storage} from "@forge/api";


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
  //  console.log(`Response: ${response.status} ${response.statusText}`);
  //  console.log(await response.json());
    return await response.json()
}

export const getIssueDetails = async() => {
    const response = await getDataFromJira(route`/rest/api/3/issue/10017`, {
        headers: {
            'Accept': 'application/json'
        }
    });
    console.log(`Response: ${response.status} ${response.statusText}`);
    console.log(await response.json());
}

export const getIssue = async(issueId) => {
    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueId}`, {
        headers: {
            'Accept': 'application/json'
        }
    });

    console.log(`Response: ${response.status} ${response.statusText}`);
    console.log(await response.json());
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

export const addCommentOnIssue = async (issueId, commentMessage) =>{
    debugger
    const body = {body:
            {
                type: "doc",
                version: 1,
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                text: commentMessage,
                                type: "text"
                            }
                        ]
                    },
                    {
                        type: "mention",
                        attrs: {
                            id:"631775c3316bbc56c425a9dc",
                            text: "Arpit Sangal"
                        }
                    }
                ]
            }
        };

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

export const addComment = async (issueId,commentMessage) => {

    const commentsList = (await getCommentsOnIssue(issueId)).comments
    console.log(commentsList)
    console.log(typeof commentsList)
    let isCommentAlreadySent = false
    if(commentsList !== undefined) {
        commentsList.map(comment => {
            console.log(comment)
            let tmpCommentText = comment.body.content[0].content[0].text
            console.log(tmpCommentText)
            if (tmpCommentText.includes(commentMessage)) {
                isCommentAlreadySent = true
                console.log("already commented")
            }
        })
    }
    if(!isCommentAlreadySent){
        console.log("Sending Comment")
        await addCommentOnIssue(issueId,commentMessage)
    }

}

const createdAt = "2022-10-14T04:21:33.247+0530"
const priority = "Critical"
const SLA = {
    'Highest': 4,
    'High': 24,
    'Medium': 48,
    'Low': 100,
    'Lowest': 200
}
const createdBy = "Reporter"
const assignedTo = "Assignee"
const priorityList = []
const dayList =
    {
        'Sunday': 0,
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6
    }
const dayListCode = {
    'Sun': 0,
    'Mon': 1,
    'Tue': 2,
    'Wed': 3,
    'Thu': 4,
    'Fri': 5,
    'Sat': 6
}
const excludeDays = ['Saturday', 'Sunday']
const includeTime = ["10:00", "19:00"]
// getSLAforNewIssue(createdAt, priority)
export const sla = (date, priority) => {
    const SLATime = SLA[priority]
    let manipulatedSLATime = SLATime
    let manipulatedDate
    let workingHours = parseInt(includeTime[1]) - parseInt(includeTime[0])
    let startTime = parseInt(includeTime[0])
    let endTime = parseInt(includeTime[1])
    let date2 = new Date(date)
    if (isDateisExcluded(date) === false) {
        console.log(date2.getHours())
        if ((date2.getHours() >= startTime) && (date2.getHours() < endTime)) {
            manipulatedSLATime = manipulatedSLATime - (endTime - date2.getHours())
            if (manipulatedSLATime < 0) {
                manipulatedDate = addHoursToDate(date, SLATime)
                console.log(manipulatedDate.toString())
                return manipulatedDate
            }
        }
        if (date2.getHours() < startTime) {
            if (SLATime > workingHours) {
                manipulatedSLATime = manipulatedSLATime - workingHours
            }
            else {
                manipulatedDate = addHoursToDate(date, (startTime - date2.getHours() + SLATime))
                console.log(manipulatedDate.toString())
                return manipulatedDate
            }
        }
    }
    manipulatedDate = addHoursToDate(date, (24 - date2.getHours()))
    console.log(manipulatedDate)
    while (manipulatedSLATime >= 0) {
        if (isDateisExcluded(manipulatedDate) === true) {
            manipulatedDate = addHoursToDate(manipulatedDate, 24)
            console.log("manipulatedDate", manipulatedDate)
        }
        else {
            manipulatedDate = addHoursToDate(manipulatedDate, startTime)
            if ((manipulatedSLATime - workingHours) > 0) {
                manipulatedSLATime = manipulatedSLATime - workingHours
                manipulatedDate = addHoursToDate(manipulatedDate, workingHours)
                manipulatedDate = addHoursToDate(manipulatedDate, 24 - endTime)
                console.log(manipulatedSLATime)
                console.log(manipulatedDate.toString())
            }
            else if (manipulatedSLATime < workingHours) {
                manipulatedDate = addHoursToDate(manipulatedDate, manipulatedSLATime)
                manipulatedSLATime = manipulatedSLATime - workingHours
                console.log("final SLA time", manipulatedDate.toString())
                return manipulatedDate.toString()
            }
            else {
                break
            }
        }
    }
}
function getTime(time) {
    var theDate = new Date(Date.parse(time))
    return theDate.toLocaleString()
}
function isDateisExcluded(date) {
    const dateOfDay = new Date(date);
    const dayNumeric = dateOfDay.getDay()
    const dayWord = Object.keys(dayListCode)[dayNumeric]
    let excludeFlag = false;
    for (let ex of excludeDays) {
        if (ex.includes(dayWord) == true) {
            excludeFlag = true
            break
        }
    }
    return excludeFlag
}
// function getHours(todaysDate) {
//     var theDate = new Date(Date.parse(todaysDate))
//     return theDate.toLocaleString()
// }
function addHoursToDate(dateTime, intHours) {
    var objDate = new Date(dateTime);
    var numberOfMlSeconds = objDate.getTime();
    var addMlSeconds = (intHours * 60) * 60 * 1000;
    var newDateObj = new Date(numberOfMlSeconds + addMlSeconds);
    return newDateObj;
}
