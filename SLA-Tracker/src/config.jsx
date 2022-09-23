import ForgeUI, {
    render,
    AdminPage,
    Fragment,
    Form,
    Select,
    Option,
    useState,
    SectionMessage,
} from '@forge/ui';
import {TIME_OPTIONS,STORAGE_KEY_PREFIX} from './constants';


import { storage } from '@forge/api';

const App = () => {
    const [isConfigSubmitted, setConfigSubmitted] = useState(false);

    const onConfigSubmit = async (config) => {
        await storage.set(`${STORAGE_KEY_PREFIX}`, config);
        const storageData = await storage.get(`${STORAGE_KEY_PREFIX}`);
        console.log(storageData)
        setConfigSubmitted(true);
    };

    const renderDateTimeConfig = (shiftLabel, shiftName) => (
        <Select label= {shiftLabel} name={shiftName}>
            {Object.values(TIME_OPTIONS).map(option => <Option label={option + " AM"} value={option + " AM"} />)}
            {Object.values(TIME_OPTIONS).map(option => <Option label={option + " PM"} value={option + " PM"} />)}
        </Select>
    )


    return (
        <Fragment>
            {isConfigSubmitted && <SectionMessage title="Configuration Saved" appearance="confirmation"/>}
            {<Form onSubmit={onConfigSubmit}>
                {renderDateTimeConfig("Choose Working Hours Start Time","startTime")}
                {renderDateTimeConfig("Choose Working Hours End Time","endTime")}
            </Form>}
        </Fragment>
    );
};

export const run = render(
    <AdminPage>
        <App />
    </AdminPage>
);
