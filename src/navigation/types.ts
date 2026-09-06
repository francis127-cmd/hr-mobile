import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  CompanySetup: undefined;
  Main: undefined;
  CreateRequest: { departmentCode?: string; requestTypeCode?: string };
  RequestDetail: { id: string };
  DepartmentQueue: { departmentCode: string; departmentName: string };
  InviteUser: undefined;
  ManageUsers: undefined;
  SSOSettings: undefined;
  RegisterCompany: undefined;
};

export type RootNavigation = NativeStackScreenProps<RootStackParamList, 'Main'>['navigation'];
