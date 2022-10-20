import {
    ESCALATION_ONE,
    ESCALATION_TWO,
    FIRST_NOTIFICATION,
    ISSUE_CREATED_NOTIFICATION,
    SECOND_NOTIFICATION,
    STORAGE_KEY_PREFIX
} from "./constants";
import {storage} from "@forge/api";

const SLA = {}
const includeTime = []
let workingDays = []
let workingHours
let  excludeDays = []
let escalation2Hours = {}
// const createdAt = "2022-10-15T14:21:33.247+0530"
// const priority = "Critical"
// const createdBy = "Reporter"
// const assignedTo = "Assignee"
// const priorityList = []
// const dayList =
//     {
//         'Sunday': 0,
//         'Monday': 1,
//         'Tuesday': 2,
//         'Wednesday': 3,
//         'Thursday': 4,
//         'Friday': 5,
//         'Saturday': 6
//     }
const dayListCode = {
    'Sun': 0,
    'Mon': 1,
    'Tue': 2,
    'Wed': 3,
    'Thu': 4,
    'Fri': 5,
    'Sat': 6
}
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// const workingDays = ['Monday', 'Tuesday', 'Wednesday']

// const excludeDays = ['Saturday', 'Sunday']
async function GetConfigurationFromStorage(projectKey){
    const storageData =  await storage.get(`${STORAGE_KEY_PREFIX}_${projectKey}`);
    if(storageData['startTime']!== undefined){
        includeTime[0] = (parseInt(storageData['startTime'].split(':')[0]))
    }
    if(storageData['endTime']!==undefined){
        includeTime[1] = (parseInt(storageData['endTime'].split(':')[0]))
    }
    workingHours = includeTime[1] - includeTime[0]

    workingDays = storageData['WorkingDays']

    excludeDays = daysOfWeek.filter(excludedDays);

    function excludedDays(day) {
        return !workingDays.includes(day);
    }

    if(storageData['Critical']!==undefined){
        SLA.Critical = getCalculatedHours(storageData['Critical'])
        escalation2Hours.Critical = getCalculatedHours(storageData['Critical_escalationSla']) || 0
    }
    if(storageData['High']!==undefined){
        SLA.High = getCalculatedHours(storageData['High'])
        escalation2Hours.High = getCalculatedHours(storageData['High_escalationSla']) || 0
    }
    if(storageData['Medium']!==undefined){
        SLA.Medium = getCalculatedHours(storageData['Medium'])
        escalation2Hours.Medium = getCalculatedHours(storageData['Medium_escalationSla']) || 0
    }
    if(storageData['Low']!==undefined){
        SLA.Low = getCalculatedHours(storageData['Low'])
        escalation2Hours.Low = getCalculatedHours(storageData['Low_escalationSla']) || 0

    }
}

function getCalculatedHours(time){
    let calculatedHours
    if(time.includes('h') || time.includes("H")){
        calculatedHours = parseInt(time.replace(/\D/g, ''))
    } else if(time.includes('d') || time.includes('D')){
        calculatedHours = parseInt(time.replace(/\D/g, '')) * workingHours
    } else{
        calculatedHours = parseInt(time.replace(/\D/g, '')) * workingHours * workingDays.length
    }

    return calculatedHours
}


// const includeTime = ["10:00", "19:00"]
// getNotificationDetails(createdAt, priority, 8)
async function getNotificationDetails(date, priority,projectKey,slaValue){
    const SLA = slaValue || await sla(date, priority, projectKey)
    const date1 = new Date(date).toLocaleString(undefined, {timeZone: 'Asia/Kolkata'})
    //notification 1 at 50%
    let half = (new Date(SLA).getTime() - new Date(date1).getTime())/2/3600000
    const Halftime = addHoursToDate(date, Math.floor(half))
    //notification 2
    const secondNotificationTime = (new Date(SLA).getTime() - new Date(date1).getTime())*4/5/3600000
    const secondtime = addHoursToDate(date, Math.floor(secondNotificationTime))
    //escalation 2
    const escalation2 = addHoursToDate(SLA, parseInt(escalation2Hours[priority]))

    const notificationDetails = {
        ExpectedSLA: SLA,
        notification1 : Halftime.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'}),
        notification2 : secondtime.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'}),
        Escalation2 : escalation2
    }
    return notificationDetails
}
export async function getParticularMessage(date, priority,projectKey,slaValue){
    const notificationDetails = await getNotificationDetails(date, priority,projectKey,slaValue)
    const currentDate = new Date().toLocaleString(undefined, {timeZone: 'Asia/Kolkata'})

    if (currentDate>= notificationDetails["notification1"] && currentDate< notificationDetails["notification2"]){
        console.log("Inside Notification 1")
        return FIRST_NOTIFICATION
    } else if(currentDate>= notificationDetails["notification2"] && currentDate < notificationDetails["ExpectedSLA"]){
        console.log("Inside Notification 2")
        return SECOND_NOTIFICATION
    } else if(currentDate>= notificationDetails["ExpectedSLA"] && currentDate < notificationDetails["Escalation2"]){
        console.log("Inside ESCALATION_ONE")
        return ESCALATION_ONE
    } else if(currentDate>= notificationDetails["Escalation2"]){
        console.log("Inside Escalation2")
        return ESCALATION_TWO
    }else{
        console.log("Inside ISSUE_CREATED_NOTIFICATION")
        return ISSUE_CREATED_NOTIFICATION
    }
}

export const sla = async (date, priority, projectKey) => {
    await GetConfigurationFromStorage(projectKey)
    const SLATime = SLA[priority]
    let manipulatedSLATime = SLATime
    let manipulatedDate
    let startTime = includeTime[0]
    let endTime = includeTime[1]
    let date2 = new Date(date)
    manipulatedDate = addHoursToDate(date, (24 - date2.getHours()))
    if (isDateisExcluded(date) === false) {
        if ((date2.getHours() >= startTime) && (date2.getHours() < endTime)) {
            manipulatedSLATime = manipulatedSLATime - (endTime - date2.getHours())
            if (manipulatedSLATime < 0) {
                manipulatedDate = addHoursToDate(date, SLATime)
                // return new Date(manipulatedDate);
                return manipulatedDate.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'})
            }
        }
        if (date2.getHours() < startTime) {
            if (SLATime > workingHours) {
                manipulatedSLATime = manipulatedSLATime - workingHours
                manipulatedDate = subtractTime(manipulatedDate, date)
            }
            else {
                manipulatedDate = addHoursToDate(date, (startTime - date2.getHours() + SLATime))
                manipulatedDate = subtractTime(manipulatedDate, date)
                // return new Date(manipulatedDate);
                return manipulatedDate.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'})
            }
        }
        if(date2.getHours() >= endTime){
            manipulatedDate = subtractTime(manipulatedDate, date)
        }
    }
    if(isDateisExcluded(date) === true){
        manipulatedDate = subtractTime(manipulatedDate, date)
    }

    while (manipulatedSLATime > 0) {
        if (isDateisExcluded(manipulatedDate) === true) {
            manipulatedDate = addHoursToDate(manipulatedDate, 24)
        }
        else {
            manipulatedDate = addHoursToDate(manipulatedDate, startTime)
            if ((manipulatedSLATime - workingHours) > 0) {
                manipulatedSLATime = manipulatedSLATime - workingHours
                manipulatedDate = addHoursToDate(manipulatedDate, workingHours)
                manipulatedDate = addHoursToDate(manipulatedDate, 24 - endTime)
                console.log(manipulatedSLATime)
                console.log("final SLA time", manipulatedDate.toString())
            }
            else if (manipulatedSLATime < workingHours) {
                manipulatedDate = addHoursToDate(manipulatedDate, manipulatedSLATime)
                manipulatedSLATime = manipulatedSLATime - workingHours
                console.log("final SLA time", manipulatedDate.toString())
                // return new Date(manipulatedDate);
                return manipulatedDate.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'})
            }
            else {
                manipulatedSLATime = manipulatedSLATime - workingHours
                manipulatedDate = addHoursToDate(manipulatedDate, workingHours)
                console.log("final SLA time", manipulatedDate.toString())
                // return new Date(manipulatedDate);
                return manipulatedDate.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'})
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
function subtractTime(dateTime, date){
    let date2 = new Date(date)
    let objDate = new Date(dateTime)
    let numberOfMlSeconds = objDate.getTime()
    let subtractMlSeconds = date2.getMinutes() * 60 * 1000 + date2.getSeconds() * 1000 + date2.getMilliseconds()
    let newDateObj = new Date(numberOfMlSeconds - subtractMlSeconds);
    return newDateObj;
}






