// @flow
import * as React from "react";
import { View, ActivityIndicator } from "react-native";
import { Text } from "react-native-elements";
import SectionedMultiSelect from "react-native-sectioned-multi-select";
import colours from "../Colours";
import type { Patient } from "./Patient";
import styles from "./PatientStyles";
import {
  getLastObservation,
  createDropdownPeriods,
  SELECT_COLOURS,
  SELECT_ICON
} from "../Helpers";

type Props = {
  patient: Patient
};

type State = {
  isLoading: boolean,
  selectedPeriods: Array<string>,
  downloadLink: ?string
};

export default class Exporter extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const lastObservation = getLastObservation(props.patient);
    this.state = {
      isLoading: false,
      selectedPeriods: lastObservation ? [lastObservation] : [],
      downloadLink: null
    };
  }

  async componentDidMount() {
    this.getDownloadLink();
  }

  getSelectedObservation = () => {
    const { selectedPeriods } = this.state;
    if (selectedPeriods.length > 0) {
      return selectedPeriods[0];
    }
    return null;
  };

  handleObservationChange = async (selectedPeriods: Array<Object>) => {
    if (selectedPeriods.length > 0) {
      this.setState({ selectedPeriods });
    }
  };

  getDownloadLink = async () => {
    const observationID = this.getSelectedObservation();
    // No observation selected
    if (observationID == null) {
      return;
    }

    this.setState({ isLoading: true });

    try {
      const response = await fetch(
        `https://vast-savannah-47684.herokuapp.com/observation/${observationID}`
      );
      if (!response.ok) {
        throw Error(response.statusText);
      }
      const json = await response.json();

      this.setState({
        isLoading: false,
        downloadLink: json
      });
    } catch (error) {
      console.log("error", error);
    }
  };

  render() {
    const { patient } = this.props;
    const { isLoading, selectedPeriods, downloadLink } = this.state;

    const dropdownPeriods = createDropdownPeriods(patient.observations);

    const spinner = (
      <ActivityIndicator size="large" color={colours.primaryGrey} />
    );

    // TODO: replace with actual link
    const download =
      downloadLink != null ? (
        <View style={styles.centerContainer}>
          <Text>
            <Text style={styles.downloadLink}>Download PDF Here</Text>
          </Text>
        </View>
      ) : (
        <Text style={styles.errorText}>Could not generate download link.</Text>
      );

    return (
      <View>
        <View style={styles.singleObservation}>
          <View style={styles.centerContainer}>
            <Text style={styles.selectText}>Select observation period:</Text>
          </View>
          <SectionedMultiSelect
            items={dropdownPeriods}
            single
            uniqueKey="id"
            selectText="Select observation period"
            onSelectedItemsChange={this.handleObservationChange}
            selectedItems={selectedPeriods}
            styles={{
              selectToggle: styles.observationToggle,
              selectToggleText: styles.dropdownToggleText,
              chipText: styles.dropdownChipText,
              confirmText: styles.dropdownConfirmText,
              itemText: styles.dropdownItemText
            }}
            colors={SELECT_COLOURS}
            selectedIconComponent={SELECT_ICON}
          />
        </View>
        {isLoading ? spinner : download}
      </View>
    );
  }
}