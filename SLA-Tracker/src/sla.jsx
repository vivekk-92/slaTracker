import ForgeUI, {
    IssuePanel, Fragment, render,
    Text, useState
} from "@forge/ui";
import {addComment, getIssue, getIssueDetails, getIssues, sla, updateSLA} from "./helpers";
import {FIRST_NOTIFICATION} from "./constants";

const App = (issueId) => {

    return (
        <Fragment>
            <Text content={issueId}/>
        </Fragment>
    );
};

export const run = render(
    <IssuePanel>
        <App />
    </IssuePanel>
);

const updateIssueId = async function(issueId) {
    return issueId
}

export async function trigger(event,context){

    console.log("Event Triggered")
    // console.log(event)
    const rest = await getIssue(event.issue.id)
    // console.log("rest", rest)
    // console.log("priority", rest.fields.priority.name)

    // console.log(sla(event.issue.fields.created,rest.fields.priority.name))
    await updateSLA(event.issue.id,sla(event.issue.fields.created,rest.fields.priority.name))
    await addComment(event.issue.id,FIRST_NOTIFICATION)
}

export async function scheduledTrigger(event){

    console.log("Web Event Triggered")
   // console.log(getIssues())
    const rest = await getIssues()
    const issuesList = rest.issues
    // console.log("rest", issuesList)
    console.log(typeof issuesList)
   issuesList.map(issue => {
       //Check if data present in custom field
       // if yes, && customField val > curreny Date Time
       //send SLA breach notification
       console.log(issue.id + "  , "+issue.fields.priority.name + " , "+ issue.fields.created + " , " + issue.fields.customfield_10048)
   })
    // console.log("priority", rest.fields.priority.name)
    //
    // console.log(sla(event.issue.fields.created,rest.fields.priority.name))
    // await updateSLA(event.issue.id,sla(event.issue.fields.created,rest.fields.priority.name))
}