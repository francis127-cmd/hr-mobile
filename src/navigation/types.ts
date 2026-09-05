import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  CreateRequest: { departmentCode?: string; requestTypeCode?: string };
  RequestDetail: { id: string };
  DepartmentQueue: { departmentCode: string; departmentName: string };
};

export type RootNavigation = NativeStackScreenProps<RootStackParamList, 'Main'>['navigation'];
